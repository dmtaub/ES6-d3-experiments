import {Clusters} from './_clustering.js';

const d3 = require('d3');
window.d3 = d3; // for testing


const groupedURL = require('file-loader!./GroupedViews.csv');
const countsURL = require('file-loader!./ViewCounts.csv');

export class App {

  constructor(dom, options) {
    this.dom = dom;
    this.props = options;
    this.clusters = new Clusters();
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

      // // output 0 NaN etc...
      // if (!this.counted[entry.viewname]) {
      //   console.log(`<<${entry.rowcount}>> = ${this.counted[entry.viewname]}`);
      // }
    }

    this.grouped = grouped;

    // for debugging
    window.app = this;
    let param = null;
    const fields = {};

    window.app.fields = fields;
    window.app.searchViews = function( i ) {
      Object.keys(window.app.counted).forEach( function(b) {
        if (b.indexOf(i) !== -1) {
          console.log(b);
        }
      });
    };
    window.app.searchFields = function( i ) {
      Object.keys(window.app.fields).forEach( function(b) {
        if (b.indexOf(i) !== -1) {
          console.log(b, ':\n', window.app.fields[b].types.map((x) => window.app.grouped[x.replace('Type', '') - 1].views.join('\n ')).join('\n '));
        }
      });
    };


    // initial pass to create and add type nodes, create param nodes, and collect stats
    let index = 0;
    for (type of grouped) {
      index++;
      type.id = `Type${index}`;
      type.radius = 8;
      type.group = 2; // for display color
      type.params = type.fingerprint.split(':');
      if (type.count === 1723) type.isNote = true;
      type.recordCount = 0;

      for (param of type.views) {
        // get total record count for type, by adding each view's count
        if (typeof this.counted[param] === 'undefined') {
          console.log(`No row count for view - ${param}`);
        } else {
          type.recordCount += this.counted[param];
        }
      }
      console.log(`${type.id}: ${type.recordCount} records`);

      for (param of type.params) {
        // collect parameters and counts for each
        if (!fields[param]) {
          fields[param] = {
            'count': 1, // starting value
            'types': [type.id],
            'group': 1,
            'radius': 4,
            'displayName': false,
            'name': param.split('-')[0],
            'type': param.split('-')[1],
            'id': param
          };
        } else {
          fields[param].count++;
          fields[param].types.push(type.id); // save all types that connect
        }
      }
    }

    this.clusters.update(grouped, fields);
    this.clusters.createChart();
  }

  render() {
    document.getElementById('title').innerText += ': GDR View Similarity';
    this.dom.appendChild(this.clusters.render());
  }
}
