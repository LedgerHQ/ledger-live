import { AppRegistry } from "react-native";
import { Sentry } from "react-native-sentry";
import Config from "react-native-config";

import App from "./src";
import { getEnabled } from "./src/components/HookSentry";

if (Config.SENTRY_DSN && !__DEV__) {
  Sentry.config(Config.SENTRY_DSN, {
    handlePromiseRejection: true,
    autoBreadcrumbs: {
      xhr: false,
    },
  }).install();

  Sentry.setUserContext({
    ip_address: null,
  });

  Sentry.setShouldSendCallback(getEnabled);
}

if (Config.DISABLE_YELLOW_BOX) {
  console.disableYellowBox = true; // eslint-disable-line no-console
}

AppRegistry.registerComponent("ledgerlivemobile", () => App);
