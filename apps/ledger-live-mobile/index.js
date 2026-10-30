import "./src/getRandomValuesPolyfill";
// Injects node.js shims.
// https://github.com/parshap/node-libs-react-native
import "node-libs-react-native/globals";

// Fix for crash with `Unsupported top level event type "onGestureHandlerStateChange" dispatched`
// https://github.com/kmagiera/react-native-gesture-handler/issues/320#issuecomment-443815828
import "react-native-gesture-handler";

// Expo's runtime installs its own URL + URLSearchParams globals (whatwg-url-without-unicode, which
// has no `URLSearchParams.size`) when `expo` is first imported, replacing whatever is already there.
// Load it before the polyfill below so the polyfill is the implementation that stays installed:
// libraries that gate on `size` (e.g. @aptos-labs/aptos-client) otherwise drop their query string.
import "expo";

// Polyfill URL + URLSearchParams — React Native's native URL doesn't support URLSearchParams.
// https://github.com/facebook/react-native/issues/23922
import "react-native-url-polyfill/auto";

// cosmjs use TextEncoder that's not available in React Native but on Node
import "text-encoding-polyfill";

// Initialize MSW for mocking API calls (only in development when MSW_ENABLED=true)
if (process.env.MSW_ENABLED === "true") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("./src/mocks/init");
}

import { AppRegistry } from "react-native";
import { preventAutoHideAsync, setOptions } from "expo-splash-screen";
import App from "./src";
import logReport from "./src/log-report";
import { initDevServerAutoReload } from "./src/hooks/useDevServerAutoReload";
import { SPLASH_SCREEN_FADE_MS } from "./src/mvvm/features/LaunchScreen/splashScreenVisibility";
preventAutoHideAsync();
setOptions({ fade: true, duration: SPLASH_SCREEN_FADE_MS });
logReport.logReportInit();
initDevServerAutoReload();

AppRegistry.registerComponent("ledgerlivemobile", () => App);
