/* eslint-disable global-require */

// polyfills and vendors

if (!window._babelPolyfill) {
  require('babel-polyfill');
}
window.wNumb = require('wnumb');
require('!style-loader!css-loader!nouislider/distribute/nouislider.css');