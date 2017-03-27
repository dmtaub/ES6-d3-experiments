import * as styles from './App.scss';

export class App {

  constructor(dom, options) {
    this.dom = dom;
    this.props = options;
    this.dom.innerHTML = 'Loading...';
  }

  render() {
    let body = '';
    body += 'hi';

    const caption = '<caption>Analysis Complete</caption>';
    const div = document.createElement('div');

    div.innerHTML = `${caption}${body}`;
    div.classList.add(styles.table);

    this.dom.innerHTML = '';
    this.dom.appendChild(div);
  }

}
