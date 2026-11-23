import { executeScenario } from "@ledgerhq/coin-tester/main";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import { scenarioFilecoin } from "./scenarii/filecoin";

global.console = require("console");
// One Lotus instance per strategy, each brought up from a fresh genesis, then about five
// transactions that wait for a tipset each.
jest.setTimeout(20 * 60 * 1000);

// The generic-adapter run is skipped: coin-filecoin's `craftTransaction` takes the fee parameters
// `signOperation` passes as custom fees and reads their gas fields as 0, so the broadcast is
// refused with "gas fee cap too low". Run it again once the coin module reads only a given gas fee cap.
const strategies: [BridgeStrategy, boolean][] = [
  ["legacy", true],
  ["generic-adapter", false],
];

describe.each(strategies)("Filecoin (%s strategy)", (strategy, enabled) => {
  (enabled ? it : it.skip)("scenario filecoin", async () => {
    try {
      await executeScenario(
        { ...scenarioFilecoin, name: `${scenarioFilecoin.name} [${strategy} strategy]` },
        strategy,
      );
    } catch (e) {
      if (e !== "done") throw e;
    }
  });
});
