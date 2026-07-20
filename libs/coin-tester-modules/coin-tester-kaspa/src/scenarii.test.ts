import { executeScenario } from "@ledgerhq/coin-tester/main";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { scenarioKaspa } from "./scenarii/kaspa";
import { killKaspaNode } from "./kaspaNode";

jest.setTimeout(600_000);

// Ensure cleanup on early termination so Docker containers don't linger
function registerSignalHandlers(cleanup: () => Promise<void>) {
  const handle = () =>
    cleanup()
      .catch(() => undefined)
      .finally(() => process.exit(1));
  process.once("SIGINT", handle);
  process.once("SIGTERM", handle);
}

registerSignalHandlers(killKaspaNode);

describe.each([["legacy"], ["generic-adapter"]] as const)(
  "Kaspa Deterministic Tester (%s strategy)",
  (strategy: BridgeStrategy) => {
    it("scenario Kaspa", async () => {
      try {
        await executeScenario(scenarioKaspa, strategy);
      } catch (e) {
        if (e !== "done") {
          await killKaspaNode();
          throw e;
        }
      }
    });
  },
);
