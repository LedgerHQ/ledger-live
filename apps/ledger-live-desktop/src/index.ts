/* eslint-disable @typescript-eslint/no-var-requires */
// nx-affected-probe
import { getEnv } from "@shared/env";

if (getEnv("PLAYWRIGHT_RUN") && getEnv("MOCK")) {
  const timemachine = require("timemachine");
  timemachine.config({
    dateString: require("../tests/time").default,
  });
}

require("./main");
