/* eslint-disable global-require */

// polyfills and vendors

if (!window._babelPolyfill) {
  require('babel-polyfill');
}
window.wNumb = require('wnumb');

window.nouislider = require('nouislider');
require('!style-loader!css-loader!nouislider/distribute/nouislider.css');