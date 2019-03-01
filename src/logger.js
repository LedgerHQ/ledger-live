// @flow
import { Sentry } from "react-native-sentry";
// for now we have the bare minimum

export default {
  critical: (e: Error) => {
    console.error(e);
    Sentry.captureException(e);
  },
};
