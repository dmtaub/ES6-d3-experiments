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

  app.render({items: ['Done Loading']});
}

document.addEventListener('DOMContentLoaded', main);
