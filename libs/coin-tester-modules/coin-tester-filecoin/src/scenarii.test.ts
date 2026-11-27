import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioFilecoin } from "./scenarii/filecoin";

global.console = require("console");
// One Lotus instance per strategy, each brought up from a fresh genesis, then about five
// transactions that wait for a tipset each.
jest.setTimeout(20 * 60 * 1000);

describe.each([["legacy"], ["generic-adapter"]] as const)("Filecoin (%s strategy)", strategy => {
  it("scenario filecoin", async () => {
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
