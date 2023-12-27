import * as preact from 'preact';
import _ from 'lodash';

import App from './App';
import './index.css';

window._ = _;
window.preact = preact;

const appElement = document.getElementById('app');
preact.render(<App />, appElement!);
