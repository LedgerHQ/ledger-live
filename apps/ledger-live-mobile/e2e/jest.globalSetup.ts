const detoxGlobalSetup = require("detox/runners/jest/globalSetup");

declare global {
  // eslint-disable-next-line no-var
  var IS_FAILED: boolean;
}

export default async () => {
  await detoxGlobalSetup();
  global.IS_FAILED = false;
};
