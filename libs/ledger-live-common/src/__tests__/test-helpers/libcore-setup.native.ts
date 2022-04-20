/* eslint-disable no-console */
import { listen } from "@ledgerhq/logs";
import "./setup";

declare global {
  namespace NodeJS {
    interface Global {
      _JEST_SETUP: (testName: string) => void;
    }
  }
}

export const setup = (testName) => {
  global._JEST_SETUP(testName);
};
// eslint-disable-next-line no-unused-vars
listen(({ type, message }) => {
  console.log(type + (message ? ": " + message : ""));
});
