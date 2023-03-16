import { getEnv } from "@ledgerhq/live-common/env";

if (getEnv("PLAYWRIGHT_RUN")) {
  const timemachine = require("timemachine");
  timemachine.config({
    dateString: require("../tests/time").default,
  });
}

require("./main");
