import * as preact from 'preact';

import App from './App';

import './index.css';

const appElement = document.getElementById('app');
preact.render(<App />, appElement!);
