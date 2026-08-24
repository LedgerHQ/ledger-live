import { executeScenario } from "@ledgerhq/coin-tester/main";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { scenarioKaspa } from "./scenarii/kaspa";

// Docker stack is started/stopped by globalSetup/globalTeardown (jest.config.ts).
// 7 minutes: 2 × (1200-block mining at 50ms + indexer catch-up) + scenario execution.
jest.setTimeout(420_000);

describe.each([["legacy"], ["generic-adapter"]] as const)(
  "Kaspa Deterministic Tester (%s strategy)",
  (strategy: BridgeStrategy) => {
    it("scenario Kaspa", async () => {
      await executeScenario(scenarioKaspa, strategy);
    });
  },
);
