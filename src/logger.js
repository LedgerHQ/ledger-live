// @flow
import { Sentry } from "react-native-sentry";
import Config from "react-native-config";
// for now we have the bare minimum

export default {
  critical: (e: Error) => {
    if (Config.DEBUG_ERROR) console.error(e);
    Sentry.captureException(e);
  },
};
