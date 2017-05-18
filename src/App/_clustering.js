import * as styles from './App.scss';

const d3 = require('d3');
// let tempNode = null;
const maxRadius = 2;
const color = d3.scaleOrdinal(d3.schemeCategory20);
// const paramIgnoreList = ['PATID-NUMBER-disabled'];
// TODO: Further condense paired sets of FOO and A_FOO
// TODO: Ranked column names and checkboxes

const intersect = function intersect(a, b) {
  return a.filter(function (e) {
    return b.indexOf(e) > -1;
  });
};

export class Clusters {
  countViewsRecords = function () {
    let views = 0;
    let records = 0;
    this.allNodes.forEach(function(x) {
      views += x.views.length;
      records += x.recordCount;
    });
    console.log('VIEWS ', views);
    console.log('RECORDS ', records);
  }
  updateCircles(labelViewport, labelSlider, max) {

    this.sliderNodes.updateOptions({'range': {'min': 0, max}});
    // this.sliderNodes.querySelector('.noUi-pips').clear;
    const oldPips = this.rangeNodes.querySelector('.noUi-pips');
    oldPips.parentElement.removeChild(oldPips);
    this.sliderNodes.pips(this.sliderNodes.options.pips);

    // Reset slider vals, TODO: possibly deal with percent old value.
    this.sliderNodes.set([0, max]);

    this.subtitle.innerHTML = labelViewport;
    this.sliderNodesLabel.innerText = labelSlider;

    this.circle
      .transition()
      .duration(1000)
      .attr('r', this.radiusFn);
  }
  setCircleNumViews() {
    this.countExtractor = (d) => d.count;
    this.radiusFn = (d) => Math.log(d.count) + 4;

    this.updateCircles('Circle size represents number of views on a log scale.',
      'Select range for nodes with specific view count:', this.maxViews);
  }
  setCircleNumRecords() {
    this.countExtractor = (d) => d.recordCount;
    this.radiusFn = (d) => Math.log(d.recordCount + 1) / 1.5 + 1;

    this.updateCircles('Circle size represents number of records on a log scale.',
     'Select range for nodes with specific record count:', this.maxRecords);
  }

  render() {
    let div = null;
    this.descriptionEl = document.getElementById('description');

    div = document.createElement('div');
    div.classList.add(styles.right);
    div.innerHTML = 'The range of this slider selects which links <br> to show based on # of shared attributes:';
    this.descriptionEl.appendChild(div);

    this.subtitle = document.createElement('div');
    this.subtitle.classList.add(styles.left);
    this.descriptionEl.appendChild(this.subtitle);

    div = document.createElement('div');
    const body = `<svg id='types' class=${styles.svg1}></svg>`;
    div.innerHTML = `${body}`;
    div.classList.add(styles.table);
    this.dom = div;

    this.fieldBoxes = document.createElement('div');
    this.fieldBoxes.classList.add(styles.selectFields);
    this.dom.appendChild(this.fieldBoxes);

    this.hovering = document.createElement('div');
    this.hovering.classList.add(styles.hovering);
    this.dom.appendChild(this.hovering);

    // this.appendDiv('hovering');
    // this.appendDiv('range');
    div = document.createElement('span');
    div.innerText = 'Links show similarity between types of views based on shared attributes';
    this.descriptionEl.appendChild(div);

    this.range = document.createElement('div');
    this.range.classList.add(styles.range);
    this.dom.appendChild(this.range);

    // https://refreshless.com/nouislider/pips/
    this.slider = window.nouislider.create(this.range, {
      start: [0, 25],
      step: 1,
      connect: true,
      orientation: 'vertical',
      direction: 'rtl', // Put '0' at the bottom of the slider
      behaviour: 'drag',
      margin: 1,
      range: {
        min: 0,
        max: 25
      },
      pips: { // Show a scale with the slider
        mode: 'count',
        stepped: true,
        density: 4,
        values: 6
      }
    });

    div = document.createElement('div');
    div.classList.add(styles.controls);

    let a = document.createElement('a');
    a.classList.add(styles.hyperlink);
    a.innerText = 'number of views';
    a.addEventListener('click', this.setCircleNumViews.bind(this));
    div.appendChild(a);

    a = document.createElement('a');
    a.classList.add(styles.hyperlink);
    a.innerText = 'number of records';
    a.addEventListener('click', this.setCircleNumRecords.bind(this));
    div.appendChild(a);

    this.sliderNodesLabel = document.createElement('div');
    this.sliderNodesLabel.classList.add(styles.rangeNodeLabel);
    div.appendChild(this.sliderNodesLabel);

    this.rangeNodes = document.createElement('div');
    this.rangeNodes.classList.add(styles.rangeNodes);
    div.appendChild(this.rangeNodes);
    this.sliderNodes = window.nouislider.create(this.rangeNodes, {
      start: [0, 100],
      step: 1,
      connect: true,
      behaviour: 'drag',
      margin: 1,
      range: {
        min: 0,
        max: 100
      },
      pips: { // Show a scale with the slider
        mode: 'count',
        stepped: true,
        values: 11
      }
    });

    this.dom.appendChild(div);

    return this.dom;
  }

  constructor() {
    console.log('initializing chart');
  }

  update(grouped, fields) {
    // store originals for later;
    this.grouped = grouped;
    this.fields = fields;

    this.setupCheckboxes();

    this.generate();
    this.graph = {nodes: this.allNodes, links: this.allLinks};

    this.maxViews = 100;
    this.maxRecords = 100;

    let elt = null;
    for (elt of grouped) {
      this.maxViews = Math.max(this.maxViews, elt.count);
      this.maxRecords = Math.max(this.maxRecords, elt.recordCount);
    }

  }

  setupCheckboxes () {
    let elt = null,
      checkbox = null,
      div = null,
      label = null;

    this.allowedParams = new Set();
    const callback = function(e) {
      if (e.target.checked) {
        this.allowedParams.add(e.target.id);
      } else {
        this.allowedParams.delete(e.target.id);
      }
      this.generate();
      this.graph = {nodes: this.allNodes, links: this.allLinks};
      this.renderChart();
      this.updateSliders();
      this.updateHovering();
    };

    for (elt of Object.keys(this.fields).sort()) {
      this.allowedParams.add(elt);
      elt = this.fields[elt];
      div = document.createElement('div');
      div.classList.add(styles.lineItem);
      div.name = elt.id;
      checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = elt.name;
      checkbox.value = true;
      checkbox.checked = true;
      checkbox.id = elt.id;
      checkbox.addEventListener('change', callback.bind(this));

      label = document.createElement('label');
      label.htmlFor = elt.id;
      label.title = elt.type;
      label.appendChild(document.createTextNode(elt.name));

      div.appendChild(checkbox);
      div.appendChild(label);
      this.fieldBoxes.appendChild(div);
    }
  }

  generate () {
    this.allNodes = [];
    this.allLinks = [];

    let type2 = null,
      type = null,
      param = null,
      key = '';
    const pairs = {};
    let i = 0,
      j = 0;

    for (type of this.grouped) {
      this.allNodes.push(type);
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
    for (param of Object.values(this.fields)) {
      if (this.allowedParams.has(param.id)) {
        loopOverPairs(param);
      }
    }

    window.pairs = pairs;

    // we then connect the type nodes by these weights
    for (key in pairs) {
      if (key[0] === 'T') {
        [type, type2] = key.split(',');
        this.allLinks.push({
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
    for (type of this.grouped) {
      for (param of type.params) {
        if (this.fields[param].count > 1) {
          this.graph.links.push({
            'source': param,
            'target': type.id,
            'value': 1
          });
          // add node for param when it meets condition
          if (!nodeSet.has(param)) {
            nodeSet.add(this.fields[param]);
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

  clickLink(d) {
    this.link.attr('stroke', dd => dd.index === d.index ? 'orange' : '#999');

    this.node
      .select('circle')
      .style('fill', dd => (dd.id === d.source.id || dd.id === d.target.id) ? 'orange' : color(dd.group));

    this.updateHovering(`${d.source.id} and ${d.target.id} share:`, false, intersect(d.source.params, d.target.params));

    this.lastClick = d.index;

    // this.link.style('fill', dd => dd.id === d.id ? 'red' : color(d.group));
  }

  updateHovering(title, subtitle, elements) {
    if (title) this._hoverTitle = title;
    if (subtitle) this._hoverSubtitle = subtitle;
    if (elements) this._hoverElements = elements;

    this.hovering.innerHTML = '';
    let span = null;

    span = document.createElement('span');
    span.classList.add(styles.title);
    span.innerText = this._hoverTitle;
    this.hovering.appendChild(span);

    if (subtitle) {
      span = document.createElement('span');
      span.classList.add(styles.subtittle);
      span.innerText = this._hoverSubtitle;
      this.hovering.appendChild(span);
    }

    let name = '',
      type = '';

    this.hovering.appendChild(document.createElement('br'));

    this._hoverElements.forEach((param) => {
      console.log(param);
      [name, type] = param.split('-');
      span = document.createElement('span');
      span.innerText = name;

      if (this.allowedParams.has(param)) {
        span.classList.add(styles.paramName);
        span.addEventListener('click', function() {
          window.location.hash = param;
        });
      } else {
        span.classList.add(styles.paramNameDisabled);
      }
      this.hovering.appendChild(span);
      this.hovering.append(type);
      this.hovering.appendChild(document.createElement('br'));

    });
  }

  clickNode(d) {
    // console.log(d);
    this.node
      .select('circle')
      .style('fill', dd => dd.id === d.id ? 'red' : color(d.group));

    this.updateHovering(d.id, `${d.recordCount} records   ${d.count} views`, d.params);

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
   const graph = {
      'nodes': [
        {'id': 'Myriel', 'group': 1},
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

    svg.call(d3.zoom().scaleExtent([1 / 4, 4])
        .on('zoom', () => {
          this.height = svgel.clientHeight / d3.event.transform.k;
          this.width = svgel.clientWidth / d3.event.transform.k;
          this.viewport.attr('transform', d3.event.transform);
          if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
        }))
        .on('dblclick.zoom', null);

    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .on('tick', this.ticked.bind(this));

    // create SVG subelements
    this.viewport = svg.append('g')
      .attr('class', 'viewport');
    this.link = this.viewport.append('g')
      .attr('class', styles.links)
      .selectAll('.link');
    this.node = this.viewport.append('g')
      .attr('class', styles.nodes)
      .selectAll('.node');

    // TODO: bindall events that re-render from function in here..

    let min = null,
      max = null,
      test = false;
    const nodes = new Set();

    const filterByLinks = function() {
      [min, max] = this.slider.get().map((x) => parseInt(x, 10));

      // clear set that we use to collect names of linked nodes
      nodes.clear();

      // console.log(min, max);

      // filter to only links with specified weight
      this.graph.links = this.allLinks.filter((l) => {
        test = l.value > min && l.value < max;
        if (test) {
          nodes.add(l.source.id);
          nodes.add(l.target.id);
        }
        return test;
      });
      // filter to only nodes with currently active links, unless min is 0
      this.graph.nodes = this.allNodes.filter((n) => min === 0 || nodes.has(n.id));
    }.bind(this);

    const filterByNumber = function() {
      [min, max] = this.sliderNodes.get().map((x) => parseInt(x, 10));

      // clear set that we use to collect names of linked nodes
      nodes.clear();

      // filter to only nodes with currently active links, unless min is 0
      let count = null;
      const countExtractor = this.countExtractor;
      this.graph.nodes = this.graph.nodes.filter(function(node) {
        count = countExtractor(node);
        if (count < max && count > min) {
          nodes.add(node.id);
          return true;
        }
        return false;
      });
      // filter to only links containing nodes above
      this.graph.links = this.graph.links.filter((l) => nodes.has(l.source.id) && nodes.has(l.target.id));

    }.bind(this);

    this.updateSliders = () => {
      filterByLinks();
      // now do it based on number...
      filterByNumber();
      if (this.graph.nodes.length) this.renderChart();
    };

    // slider for links
    this.slider.on('slide', this.updateSliders.bind(this));
    this.slider.on('set', this.updateSliders.bind(this));

    // slider for nodes
    this.sliderNodes.on('slide', this.updateSliders.bind(this));
    this.sliderNodes.on('set', this.updateSliders.bind(this));


    // now called automatically on slider update

    this.renderChart();
    this.setCircleNumViews();
  }


  renderChart() {
    this.node = this.node.data(this.graph.nodes);
    this.node.exit().remove();
    this.node = this.node
      .enter().append('g').attr('class', 'node').merge(this.node).call(d3.drag()
            .on('start', this.dragstarted.bind(this))
            .on('drag', this.dragged.bind(this))
            .on('end', this.dragended.bind(this)))
      .on('click', this.clickNode.bind(this));

    this.node.select('circle').remove();
    this.circle = this.node.append('circle')
        .attr('r', this.radiusFn)
        .attr('fill', d => d.id === this.lastClick ? 'red' : color(d.group));

    this.node.append('title')
        .text(d => d.id);

    this.node.append('text')
          .attr('dx', 6)
          .attr('dy', '.35em')
          .text((d) => d.displayName ? d.id : '');

    this.link = this.link.data(this.graph.links);
    this.link.exit().remove();
    this.link = this.link
      .enter().append('line')
      .merge(this.link)
      .attr('stroke-width', d => Math.sqrt(d.value) + 1)
      .attr('stroke', '#999')
      .on('click', this.clickLink.bind(this));

    this.simulation
        .nodes(this.graph.nodes);

    this.simulation.force('link')
        .links(this.graph.links);

    this.simulation.alpha(1).restart();

  }

}
