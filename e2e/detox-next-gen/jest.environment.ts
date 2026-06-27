import { Circus } from "@jest/types";

import DetoxEnvironment from "detox/runners/jest/testEnvironment";

export default class TestEnvironment extends DetoxEnvironment {
  declare global: typeof globalThis;

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }

  async handleTestEvent(event: Circus.Event, state: Circus.State) {
    await super.handleTestEvent(event, state);
  }
}
