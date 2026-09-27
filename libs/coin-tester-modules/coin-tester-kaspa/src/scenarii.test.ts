import { executeScenario } from "@ledgerhq/coin-tester/main";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { scenarioKaspa } from "./scenarii/kaspa";

// Docker stack is started/stopped by globalSetup/globalTeardown (jest.config.ts).
// 7 minutes per strategy run. Funding is mined once in globalSetup (outside this timeout), so this
// only covers the syncs and the scenario's transactions.
jest.setTimeout(420_000);

describe.each([["legacy"], ["generic-adapter"]] as const)(
  "Kaspa Deterministic Tester (%s strategy)",
  (strategy: BridgeStrategy) => {
    it("scenario Kaspa", async () => {
      await executeScenario(scenarioKaspa, strategy);
    });
  },
);
