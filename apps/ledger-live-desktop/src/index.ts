/* eslint-disable @typescript-eslint/no-var-requires */
// Must be imported before "electron" is required anywhere, so dd-trace can wrap BrowserWindow in time.
import "@datadog/electron-sdk/instrument";
import { getEnv } from "@shared/env";

if (getEnv("PLAYWRIGHT_RUN") && getEnv("MOCK")) {
  const timemachine = require("timemachine");
  timemachine.config({
    dateString: require("../tests/time").default,
  });
}

require("./main");
