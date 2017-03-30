import * as styles from './App.scss';
const d3 = require('d3');

const maxRadius = 2;
const color = d3.scaleOrdinal(d3.schemeCategory20);

const paramIgnoreList = ['PATID-NUMBER-disabled'];

    // TODO: Further condense paired sets of FOO and A_FOO
    // TODO: Ranked column names and checkboxes


export class Clusters {
  setCircleNumViews() {
    document.getElementById('description').innerHTML = 'Circle Size represents number of views on a log scale. <br>Links show similarity between types of views';
    this.circle
    .transition()
    .duration(1000)
        .attr('r', d => Math.log(d.count) + 4);
  }
  setCircleNumRecords() {
    document.getElementById('description').innerHTML = 'Circle Size represents number of records on a log scale. <br>Links show similarity between types of views';
    this.circle
    .transition()
    .duration(1000)
        .attr('r', d => Math.log(d.recordCount + 1) / 2);
  }

  render() {
    let div = document.createElement('div');
    const body = `<svg id='types' class=${styles.svg1}></svg>`;
    div.innerHTML = `${body}`;
    div.classList.add(styles.table);
    this.dom = div;

    div = document.createElement('div');
    div.classList.add(styles.controls);

    let a = document.createElement('a');
    a.classList.add(styles.link);
    a.innerText = 'number of views';
    a.addEventListener('click', this.setCircleNumViews.bind(this));
    div.appendChild(a);

    a = document.createElement('a');
    a.classList.add(styles.link);
    a.innerText = 'number of records';
    a.addEventListener('click', this.setCircleNumRecords.bind(this));
    div.appendChild(a);

    this.dom.appendChild(div);

    return this.dom;
  }

  constructor() {
    this.graph = {nodes: [], links: []};
    document.getElementById('description').innerHTML = 'Circle Size represents number of views on a log scale.<br> Links show similarity between types of views';
  }

  update(grouped, fields) {


    let type2 = null,
      type = null,
      param = null,
      key = '';
    const pairs = {};
    let i = 0,
      j = 0;

    for (type of grouped) {
      this.graph.nodes.push(type);
    }


    const loopOverPairs = function(param) {
      for (i = 0; i < param.types.length; i++) {
        for (j = i + 1; j < param.types.length; j++) {
          type = param.types[i];
          type2 = param.types[j];
          if (type !== type2) {
            key = [type, type2].sort().join(); // join with comma
            pairs[key] = pairs[key] ? pairs[key] + 1 : 1;
          }
        }
      }
    };

    // if all param nodes know their linked types, we can iterate
    // over them to count co-occurance
    for (param of Object.values(fields)) {
      if (paramIgnoreList.indexOf(param.id) === -1) {
        loopOverPairs(param);
      }
    }

    window.pairs = pairs;

    // we then connect the type nodes by these weights
    for (key in pairs) {
      if (key[0] === 'T') {
        [type, type2] = key.split(',');
        this.graph.links.push({
          'source': type,
          'target': type2,
          'value': pairs[key]
        });
      }
    }

    /*
    const nodeSet = new Set();
    // second pass to decide which links to add
    // add link if param has > 1 references
    for (type of grouped) {
      for (param of type.params) {
        if (fields[param].count > 1) {
          this.graph.links.push({
            'source': param,
            'target': type.id,
            'value': 1
          });
          // add node for param when it meets condition
          if (!nodeSet.has(param)) {
            nodeSet.add(fields[param]);
          }
        }
      }
    }

    // add all nodes that we found above
    nodeSet.forEach( item => this.graph.nodes.push(item) );
    */
  }

  ticked() {
    this.node
      .attr('transform', (d) => {
        d.x = Math.max(maxRadius, Math.min(this.width - maxRadius, d.x));
        d.y = Math.max(maxRadius, Math.min(this.height - maxRadius, d.y));
        return `translate(${d.x},${d.y})`;
      });
    this.link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
  }

  clickNode(d) {
    if (!this.hovering) {
      this.hovering = document.createElement('div');
      this.hovering.classList.add(styles.hovering);
      this.dom.appendChild(this.hovering);
    }
    // console.log(d);
    this.node
      .select('circle')
      .style('fill', dd => dd.id === d.id ? 'red' : color(d.group));

    let name = '',
      type = '';
    this.hovering.innerHTML = `
    <span class=${styles.title}>${d.id}</span><br>
    <span class=${styles.records}>${d.recordCount} records</span>&nbsp;&nbsp;
    <span class=${styles.views}>${d.count} views</span>

    <br>`;
    d.params.forEach((param) => {
      [name, type] = param.split('-');
      this.hovering.innerHTML += `<span class="${styles.paramName}">${name}</span>${type}<br>`;
    });

    // debug, output all matching views
    console.log(`This type has ${d.count} views, click again to print them to console.`);
    if (this.lastClick === d.id) d.views.forEach((v) => console.log(v));
    this.lastClick = d.id;

  }

  dragstarted(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  dragended(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  /**
   * @param  {Object}
   * @return {undefined}
   *
   * expects graph input of form:
   *
   const graph = {
      'nodes': [
        {'id': 'Myriel', 'group': 1},
        {'id': 'Napoleon', 'group': 1},
        {'id': 'Mlle.Baptistine', 'group': 2}
      ],
      'links': [
        {'source': 'Napoleon', 'target': 'Myriel', 'value': 1},
        {'source': 'Mlle.Baptistine', 'target': 'Myriel', 'value': 8}
      ]
    };
   */

  createChart() {
    const svg = d3.select('svg#types'),
      svgel = svg.node();
    this.width = svgel.clientWidth;
    this.height = svgel.clientHeight;

    const view = svg.append('g').attr('class', 'viewport');

    svg.call(d3.zoom().scaleExtent([1 / 4, 4])
        .on('zoom', () => {
          this.height = svgel.clientHeight / d3.event.transform.k;
          this.width = svgel.clientWidth / d3.event.transform.k;
          view.attr('transform', d3.event.transform);
          if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
        }))
        .on('dblclick.zoom', null);

    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    this.link = view.append('g')
      .attr('class', styles.links)
      .selectAll('line')
      .data(this.graph.links)
      .enter().append('line')
      .attr('stroke-width', d => Math.sqrt(d.value));

    this.node = view.append('g').attr('class', styles.nodes)
      .selectAll('.node')
      .data(this.graph.nodes)
      .enter().append('g').attr('class', 'node').call(d3.drag()
            .on('start', this.dragstarted.bind(this))
            .on('drag', this.dragged.bind(this))
            .on('end', this.dragended.bind(this)))
      .on('click', this.clickNode.bind(this));

    this.circle = this.node.append('circle')
        .attr('r', d => Math.log(d.count) + 5)
        .attr('fill', d => color(d.group));

    this.node.append('title')
        .text(d => d.id);

    this.node.append('text')
          .attr('dx', 6)
          .attr('dy', '.35em')
          .text((d) => d.displayName ? d.id : '');

    this.simulation
        .nodes(this.graph.nodes)
        .on('tick', this.ticked.bind(this));

    this.simulation.force('link')
        .links(this.graph.links);
  }

}
