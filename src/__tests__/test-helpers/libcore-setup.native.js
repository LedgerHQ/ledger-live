/* eslint-disable no-console */
import { listen } from "@ledgerhq/logs";
import "./setup";
import "./implement-react-native-libcore";

export const setup = (testName) => {
  global._JEST_SETUP(testName);
};

// eslint-disable-next-line no-unused-vars
listen(({ id, date, type, message, ...rest }) => {
  console.log(type + (message ? ": " + message : ""));
});
