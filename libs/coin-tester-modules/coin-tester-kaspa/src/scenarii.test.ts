import { executeScenario } from "@ledgerhq/coin-tester/main";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { scenarioKaspa } from "./scenarii/kaspa";
import { scenarioKaspaDrain } from "./scenarii/kaspaDrain";

// Docker stack is started/stopped by globalSetup/globalTeardown (jest.config.ts), which also funds
// every test account once. 7 minutes per scenario run: syncs and the scenario's transactions only.
jest.setTimeout(420_000);

// Each (scenario, strategy) pair runs on its own account (testAccounts.ts), so no run sees another's
// transactions.
describe.each([["legacy"], ["generic-adapter"]] as const)(
  "Kaspa Deterministic Tester (%s strategy)",
  (strategy: BridgeStrategy) => {
    it("scenario Kaspa (history across pages)", async () => {
      await executeScenario(scenarioKaspa, strategy);
    });

    it("scenario Kaspa (drain to zero)", async () => {
      await executeScenario(scenarioKaspaDrain, strategy);
    });
  },
);
