import {Clusters} from './_clustering.js';

const d3 = require('d3');
window.d3 = d3; // for testing

export class App {

  constructor(dom, options) {
    this.dom = dom;
    this.props = options;
    this.clusters = new Clusters();
  }


  log(str) {
    const div = document.createElement('div');
    div.innerHTML = str;
    this.dom.appendChild(div);
  }

  analyze() {
    // window.data = data; // for debugging
    this.clusters.update();
    this.clusters.renderChart();
    document.title = 'Logo Sequence Chart';

  }

  render() {
    // console.log('render');
    document.getElementById('title').innerText += ': Base Pair Frequency';
    this.dom.appendChild(this.clusters.render());
    this.analyze();

  }
}
