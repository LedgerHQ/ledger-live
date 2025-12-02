import "react-native-get-random-values";
// Injects node.js shims.
// https://github.com/parshap/node-libs-react-native
import "node-libs-react-native/globals";

// Fix for crash with `Unsupported top level event type "onGestureHandlerStateChange" dispatched`
// https://github.com/kmagiera/react-native-gesture-handler/issues/320#issuecomment-443815828
import "react-native-gesture-handler";

/** URL polyfill */
// URL object `intentionally` lightweight, does not support URLSearchParams features
// https://github.com/facebook/react-native/issues/23922
import "react-native-url-polyfill/auto";

// cosmjs use TextEncoder that's not available in React Native but on Node
import "text-encoding-polyfill";

// Initialize MSW for mocking API calls
import "./src/mocks/init";

// import all possible polyfills done by live-common for React Native. See in reactNative.ts for more details.
import "@ledgerhq/live-common/reactNative";

import { AppRegistry } from "react-native";
import BackgroundRunnerService from "./services/BackgroundRunnerService";
import App from "./src";
import logReport from "./src/log-report";

logReport.logReportInit();

AppRegistry.registerComponent("ledgerlivemobile", () => App);
AppRegistry.registerHeadlessTask("BackgroundRunnerService", () => BackgroundRunnerService);
