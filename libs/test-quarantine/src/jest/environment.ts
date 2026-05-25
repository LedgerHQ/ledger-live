import JSDOMEnvironment from "jest-environment-jsdom";
import type { CircusAsyncEvent, CircusState, CircusTestStartEvent } from "./circusTypes.js";
import { matchCircusTest } from "../shared/matchTest.js";
import { getMatcherState } from "../shared/matcherState.js";
import { formatQuarantineSkipMessage } from "../shared/testIdentity.js";

type EnvironmentContext = ConstructorParameters<typeof JSDOMEnvironment>[1] & {
  testPath: string;
};

type EnvironmentConstructor = new (
  config: ConstructorParameters<typeof JSDOMEnvironment>[0],
  context: EnvironmentContext,
) => JSDOMEnvironment;

/**
 * Wraps a Jest test environment so `failureMode: skip` quarantine entries are skipped at `test_start`.
 */
export function createQuarantineEnvironment(
  BaseEnvironment: EnvironmentConstructor = JSDOMEnvironment,
): EnvironmentConstructor {
  return class QuarantineEnvironment extends BaseEnvironment {
    private readonly testFilePath: string;

    constructor(
      config: ConstructorParameters<typeof JSDOMEnvironment>[0],
      context: EnvironmentContext,
    ) {
      super(config, context);
      // Jest 30 passes the file path on `context`, not `config` (see jest-runner).
      this.testFilePath = context.testPath;
    }

    async handleTestEvent(event: CircusAsyncEvent, _state: CircusState): Promise<void> {
      if (event.name !== "test_start") {
        return;
      }

      const testEvent = event as CircusTestStartEvent;
      if (!this.testFilePath) {
        return;
      }

      const matcherState = getMatcherState();
      const entry = matchCircusTest(matcherState, this.testFilePath, testEvent.test);
      if (!entry || entry.failureMode !== "skip") {
        return;
      }

      testEvent.test.mode = "skip";
      testEvent.test.duration = 0;
      // Surface the same message Playwright uses when skipping.
      Object.defineProperty(testEvent.test, "quarantineSkipMessage", {
        value: formatQuarantineSkipMessage(entry),
        enumerable: false,
        configurable: true,
      });
    }
  };
}

export default createQuarantineEnvironment();
