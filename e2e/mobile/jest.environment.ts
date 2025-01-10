import { takeSpeculosScreenshot } from "./utils/speculosUtils";
import { Circus } from "@jest/types";
import { logMemoryUsage } from "./helpers/commonHelpers";
import { device } from "detox";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DetoxEnvironment = require("detox/runners/jest/testEnvironment");

class TestEnvironment extends DetoxEnvironment {
  async setup() {
    await super.setup();
    await device.installApp();
  }

  async handleTestEvent(event: Circus.Event, state: Circus.State) {
    await super.handleTestEvent(event, state);

    if (["hook_failure", "test_fn_failure"].includes(event.name)) {
      this.global.IS_FAILED = true;
    }
    if (this.global.IS_FAILED && ["test_fn_start", "test_fn_failure"].includes(event.name)) {
      await takeSpeculosScreenshot();
    }
    if (event.name === "run_start") {
      await logMemoryUsage();
    }
  }
}

module.exports = TestEnvironment;
