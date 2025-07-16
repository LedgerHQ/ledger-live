const detoxEnvironment = require("detox/runners/jest/testEnvironment");
import { logMemoryUsage } from "./helpers/commonHelpers";

class TestEnvironment extends detoxEnvironment {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleTestEvent(event: any, state: any) {
    await super.handleTestEvent(event, state);

    if (["hook_failure", "test_fn_failure"].includes(event.name)) {
      this.global.IS_FAILED = true;
    }
    if (event.name === "run_start") {
      await logMemoryUsage();
    }
  }
}

export default TestEnvironment;
