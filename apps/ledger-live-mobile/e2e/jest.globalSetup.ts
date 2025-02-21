/* eslint-disable no-var */
const detoxGlobalSetup = require("detox/runners/jest/globalSetup");

declare global {
  var IS_FAILED: boolean;
  var speculosDevices: Map<number, string>;
}

export default async () => {
  await detoxGlobalSetup();
  global.IS_FAILED = false;
  global.speculosDevices = new Map<number, string>();
};
