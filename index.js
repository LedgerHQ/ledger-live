import { AppRegistry } from "react-native";
import App from "./src";
import { Sentry } from "react-native-sentry";
import Config from "react-native-config";

if (Config.SENTRY_DSN) {
  Sentry.config(Config.SENTRY_DSN).install();
}

AppRegistry.registerComponent("ledgerwalletmobile", () => App);
