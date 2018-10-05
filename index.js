import { AppRegistry } from "react-native";
import { Sentry } from "react-native-sentry";
import Config from "react-native-config";
import DeviceInfo from "react-native-device-info";

import App from "./src";

if (Config.SENTRY_DSN) {
  Sentry.config(Config.SENTRY_DSN, {
    autoBreadcrumbs: {
      xhr: false,
    },
  }).install();

  Sentry.setUserContext({
    userID: DeviceInfo.getUniqueID(),
    ip_address: null,
  });
}

AppRegistry.registerComponent("ledgerlivemobile", () => App);
