import { getEnv } from "@ledgerhq/live-common/env";

if (getEnv("PLAYWRIGHT_RUN")) {
  const timemachine = require("timemachine");
  timemachine.config({
    dateString: require("../tests/time").default,
  });
}

if (!process.env.IS_INTERNAL_PROCESS) {
  // Main electron thread
  require("./main");
} else {
  // Internal thread (coins, hardware)
  require("./internal");
}
