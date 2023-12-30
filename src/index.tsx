import * as preact from 'preact';
import _ from 'lodash';

import TimerApp from './TimerApp';
import './index.css';

window._ = _;
window.preact = preact;

const appElement = document.getElementById('app');
preact.render(<TimerApp />, appElement!);
