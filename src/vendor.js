/* eslint-disable global-require */

// polyfills and vendors

if (!window._babelPolyfill) {
  require('babel-polyfill');
}
window.d3 = require('d3');