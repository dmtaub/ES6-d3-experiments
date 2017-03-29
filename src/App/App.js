import * as styles from './App.scss';
const d3 = require('d3');
window.d3 = d3; // for testing

const groupedURL = require('file-loader!./GroupedViews.csv');
const countsURL = require('file-loader!./ViewCounts.csv');

export class App {

  constructor(dom, options) {
    this.dom = dom;
    this.props = options;
    this.dom.innerHTML = 'Loading...';

    d3.queue()
      .defer(this.oddCSVparse, groupedURL)
      .defer(d3.csv, countsURL)
      .await(this.analyze.bind(this));
  }

  oddCSVparse(url, callback) {
    let result = null;
    const _byRow = function (row, i) {
      if (!result) {
        result = Array(...Array(row.length ))
          .map( () => new Object({
            views: []
          }));
      }
      let viewname = '';
      for (let j = 1; j < row.length; j++) {
        if (i === 0) {
          result[j].fingerprint = row[j];
        } else if (i === 1) {
          result[j].count = +row[j];
        } else {
          viewname = row[j].trim();
          if (viewname.length !== 0) result[j].views.push(viewname);
        }

      }
    };
    d3.request(url)
        .mimeType('text/csv')
        .response(function(xhr) {
          d3.csvParseRows(xhr.responseText, _byRow);
          // remove the first empty element
          return result.splice(1);
        }).get(callback);
  }

  log(str) {
    const div = document.createElement('div');
    div.innerHTML = str;
    this.dom.appendChild(div);
  }

  analyze(error, grouped, counts) {
    if (error) console.log(error);

    let entry = null,
      type = null;


    this.counted = {};
    for (entry of counts) {
      if (entry.rowcount.trim() === '') {
        this.counted[entry.viewname] = 0;
      } else {
        this.counted[entry.viewname] = +entry.rowcount.replace(/,/g, '');
      }

      // output 0 NaN etc...
      // if (!this.counted[entry.viewname]) {
      //  console.log(entry.rowcount);
      // }
    }

    this.grouped = grouped;
    let index = 0;
    for (type of grouped) {
      type.params = type.fingerprint.split(':');
      index++;
      type.label = `Type${index}`;
    }

    // for debugging
    window.app = this;

    let param = null;
    const fields = {};
    const graph = {nodes: [], links: []};
    window.app.graph = graph;
    window.app.fields = fields;


    // initial pass to create type nodes and collect stats
    for (type of grouped) {
      graph.nodes.push({'id': type.label, 'group': 1});
      for (param of type.params) {
        // collect parameters and counts for each
        if (!fields[param]) {
          fields[param] = 1;
        } else {
          fields[param]++;
        }
      }
    }

    const nodeSet = new Set();
    // add links if param has > 1 references
    for (type of grouped) {
      for (param of type.params) {
        if (fields[param] > 1) {
          graph.links.push({
            'source': param,
            'target': type.label,
            'value': 1
          });
          // add node for param when it meets condition
          if (!nodeSet.has(param)) {
            graph.nodes.push({'id': param, 'group': 2});
            nodeSet.add(param);
          }
        }
      }
    }

    /*     'nodes': [
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
    this.createChart(graph);
  }

  render() {
    const body = `<svg class=${styles.svg1}></svg>`;

    const caption = '<p>Analysis Complete</p>';
    const div = document.createElement('div');

    div.innerHTML = `${caption}${body}`;
    div.classList.add(styles.table);

    this.dom.innerHTML = '';
    this.dom.appendChild(div);
  }
  // begin force simulation stuff
  ticked() {
    this.link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

    this.node
        .attr('transform', (d) => `translate(${d.x},${d.y})`);
       // .attr('cx', d => d.x)
       // .attr('cy', d => d.y);
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


  createChart(graph) {
    const svg = d3.select('svg'),
      svgel = svg.node(),
      width = svgel.clientWidth,
      height = svgel.clientHeight;

    const view = svg.append('g').attr('class', 'viewport');

    svg.call(d3.zoom().scaleExtent([1 / 4, 4])
        .on('zoom', () => {
          view.attr('transform', d3.event.transform);
        }));

    const color = d3.scaleOrdinal(d3.schemeCategory20);

    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2));

    this.link = view.append('g')
      .attr('class', styles.links)
      .selectAll('line')
      .data(graph.links)
      .enter().append('line')
      .attr('stroke-width', d => Math.sqrt(d.value));

    this.node = view.append('g').attr('class', styles.nodes)
      .selectAll('.node')
      .data(graph.nodes)
      .enter().append('g').attr('class', 'node').call(d3.drag()
            .on('start', this.dragstarted.bind(this))
            .on('drag', this.dragged.bind(this))
            .on('end', this.dragended.bind(this)));

    this.node.append('circle')
        .attr('r', 5)
        .attr('fill', d => color(d.group));


    this.node.append('title')
        .text(d => d.id);

    this.node.append('text')
          .attr('dx', 6)
          .attr('dy', '.35em')
          .text((d) => d.group === 1 ? d.id : '');

    this.simulation
        .nodes(graph.nodes)
        .on('tick', this.ticked.bind(this));

    this.simulation.force('link')
        .links(graph.links);
  }
}
