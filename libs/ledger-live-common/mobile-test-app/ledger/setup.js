// @flow
import { setTestFile } from "../engine";

global._JEST_SETUP = (testName: string) => {
  setTestFile(testName);
};
