import { logMemoryUsage } from "./helpers/commonHelpers";
import { takeSpeculosScreenshot } from "./utils/speculosUtils";

// pull in the Detox base env (this is a CommonJS module)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DetoxEnvironment = require("detox/runners/jest/testEnvironment");

class TestEnvironment extends DetoxEnvironment {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleTestEvent(event: any, state: any) {
    // first let Detox do its thing
    await super.handleTestEvent(event, state);

    // on any hook or test failure, mark a flag
    if (["hook_failure", "test_fn_failure"].includes(event.name)) {
      this.global.IS_FAILED = true;
    }

    // then whenever a test starts or fails and the flag is set, grab a screenshot
    if (this.global.IS_FAILED && ["test_fn_start", "test_fn_failure"].includes(event.name)) {
      await takeSpeculosScreenshot();
    }

    // on the very start of the run, log memory usage
    if (event.name === "run_start") {
      await logMemoryUsage();
    }
  }
}

// **Finally**, export it as a CJS module so Jest’s `require(...)` returns your class directly.
module.exports = TestEnvironment;
