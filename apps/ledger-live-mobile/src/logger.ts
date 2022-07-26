/* eslint-disable no-console */
import * as Sentry from "@sentry/react-native";
import Config from "react-native-config";
// for now we have the bare minimum

export default {
  critical: (e: Error) => {
    if (Config.DEBUG_ERROR) console.error(e);
    else console.log(e);
    if (e instanceof Error) {
      Sentry.captureException(e);
    }
  },
};
