import { AppRegistry } from "react-native";
import { Sentry } from "react-native-sentry";
import Config from "react-native-config";

import App from "./src";

if (Config.SENTRY_DSN) {
  Sentry.config(Config.SENTRY_DSN, {
    autoBreadcrumbs: {
      xhr: false,
    },
  }).install();

  Sentry.setUserContext({
    ip_address: null,
  });
}

if (Config.DISABLE_YELLOW_BOX) {
  console.disableYellowBox = true; // eslint-disable-line no-console
}

AppRegistry.registerComponent("ledgerlivemobile", () => App);
