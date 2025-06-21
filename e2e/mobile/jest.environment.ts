import { takeSpeculosScreenshot } from "./utils/speculosUtils";
import { Circus } from "@jest/types";
import { logMemoryUsage } from "./helpers/commonHelpers";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DetoxEnvironment = require("detox/runners/jest/testEnvironment");

class TestEnvironment extends DetoxEnvironment {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(config: any, context: any) {
    super(config, context);

    const originalStderrWrite = process.stderr.write;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.stderr as any).write = (
      chunk: string | Uint8Array,
      encoding?: BufferEncoding,
      callback?: (err?: Error) => void,
    ): boolean => {
      if (typeof chunk === "string" && chunk.includes("maxContentLength size of")) {
        // Suppress the error by returning true (indicating the write was handled)
        if (callback) callback();
        return true;
      }
      return originalStderrWrite.call(process.stderr, chunk, encoding, callback);
    };

    // Ensure stderr is restored when the environment is torn down
    this.global.__DETOX_TEARDOWN__ = async () => {
      process.stderr.write = originalStderrWrite;
    };
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
