import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioTron } from "./scenarii/tron";

global.console = require("console");
jest.setTimeout(600_000);

// Tron has a single bridge, so `executeScenario`'s `strategy` argument is left off, as in the other
// single-bridge testers.
describe("Tron", () => {
  it("scenario tron", async () => {
    try {
      await executeScenario(scenarioTron);
    } catch (e) {
      if (e !== "done") throw e;
    }
  });
});
