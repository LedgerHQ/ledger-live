import { Circus } from "@jest/types";

import DetoxEnvironment from "detox/runners/jest/testEnvironment";
import { captureViewHierarchy } from "./helpers/diagnostics";

export default class TestEnvironment extends DetoxEnvironment {
  declare global: typeof globalThis;

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }

  async handleTestEvent(event: Circus.Event, state: Circus.State) {
    // A failing `beforeAll`/`afterAll` is a `hook_failure`, NOT `test_fn_failure` —
    // and the swap flow opens the webview in `beforeAll`, so this is the common
    // case. Capture it BEFORE super may tear the app down.
    if (event.name === "hook_failure") {
      await captureViewHierarchy();
    }

    await super.handleTestEvent(event, state);

    // A failing test body: capture after super so the failure is registered first;
    // the app is still on the failing screen until afterEach/afterAll run.
    if (event.name === "test_fn_failure") {
      await captureViewHierarchy();
    }
  }
}
