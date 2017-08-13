// global css
import './theme/theme.scss';

// classes you want to use immediately
import {App} from './App';

/**
 * entrance code for SPA
 */
function main() {
  document.title = 'Loading...';

  const app = new App(document.querySelector('.container'));
  window.app = app; // for debugging

  app.render({items: ['Done Loading']});
}

document.addEventListener('DOMContentLoaded', main);
