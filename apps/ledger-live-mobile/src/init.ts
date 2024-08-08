import { AppRegistry } from "react-native";
import BackgroundRunnerService from "../services/BackgroundRunnerService";
import App from ".";
import logReport from "./log-report";
import { withSentry } from "./sentry";

if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("react-native-performance-flipper-reporter").setupDefaultFlipperReporter();
}

logReport.logReportInit();

const Root = withSentry(App);

AppRegistry.registerComponent("ledgerlivemobile", () => Root);
AppRegistry.registerHeadlessTask("BackgroundRunnerService", () => BackgroundRunnerService);
