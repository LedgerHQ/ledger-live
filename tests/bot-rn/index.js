/**
 * @format
 */

// Injects node.js shims.
// https://github.com/parshap/node-libs-react-native
import "node-libs-react-native/globals";

// cosmjs use TextEncoder that's not available in React Native but on Node
import 'text-encoding-polyfill';

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import './src/live-common-setup';

AppRegistry.registerComponent(appName, () => App);
