const detoxEnvironment = require("detox/runners/jest/testEnvironment");
import { takeSpeculosScreenshot } from "./helpers";

class TestEnvironment extends detoxEnvironment {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleTestEvent(event: any, state: any) {
    await super.handleTestEvent(event, state);

    if (["hook_failure", "test_fn_failure"].includes(event.name)) {
      this.global.IS_FAILED = true;
    }
    if (this.global.IS_FAILED && ["test_fn_start", "test_fn_failure"].includes(event.name)) {
      await takeSpeculosScreenshot();
    }
  }
}

export default TestEnvironment;
