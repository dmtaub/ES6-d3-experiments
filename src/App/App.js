import {Clusters} from './_clustering.js';

const d3 = require('d3');
window.d3 = d3; // for testing

const dataURL = require('file-loader!./data.csv');

export class App {

  constructor(dom, options) {
    this.dom = dom;
    this.props = options;
    this.clusters = new Clusters();

    d3.queue()
      .defer(d3.csv, dataURL, function(d, i, columns) {
        let t = 0;
        for (let i = 1; i < columns.length; ++i) {
          t += d[columns[i]] = +d[columns[i]];
        }
        d.total = t;
        return d;
      })
      .await(this.analyze.bind(this));
  }


  log(str) {
    const div = document.createElement('div');
    div.innerHTML = str;
    this.dom.appendChild(div);
  }

  analyze(error, data) {
    // window.data = data; // for debugging

    if (error) console.log(error);
    this.clusters.update(data);
    this.clusters.renderChart();
    document.title = 'Logo Sequence Chart';

  }

  render() {
    // console.log('render');
    document.getElementById('title').innerText += ': Base Pair Frequency';
    this.dom.appendChild(this.clusters.render());

  }
}
