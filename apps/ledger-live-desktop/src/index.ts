/* eslint-disable @typescript-eslint/no-var-requires */
import { getEnv } from "@ledgerhq/live-env";

if (getEnv("PLAYWRIGHT_RUN") && getEnv("MOCK")) {
  const timemachine = require("timemachine");
  timemachine.config({
    dateString: require("../tests/time").default,
  });
}

console.log("this is a test 2");
require("./main");
