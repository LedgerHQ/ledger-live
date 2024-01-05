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

// import all possible polyfills done by live-common for React Native. See in reactNative.ts for more details.
import "@ledgerhq/live-common/reactNative";

import { AppRegistry } from "react-native";
import BackgroundRunnerService from "./services/BackgroundRunnerService";
import App from "./src";
import logReport from "./src/log-report";
import { withSentry } from "./src/sentry";

if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("react-native-performance-flipper-reporter").setupDefaultFlipperReporter();
}

logReport.logReportInit();

const Root = withSentry(App);

AppRegistry.registerComponent("ledgerlivemobile", () => Root);
AppRegistry.registerHeadlessTask("BackgroundRunnerService", () => BackgroundRunnerService);
