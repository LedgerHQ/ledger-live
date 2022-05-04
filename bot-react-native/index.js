/**
 * @format
 */

import './shim.js';
import crypto from 'crypto';
import 'text-encoding-polyfill';
import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import './src/live-common-setup';

AppRegistry.registerComponent(appName, () => App);
