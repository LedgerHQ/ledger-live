import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioSolana } from "./scenarii/solana";
// Import fixtures to setup mock store
import "./fixtures";

describe("Solana Deterministic Tester", () => {
  it("scenario Solana", async () => {
    try {
      await executeScenario(scenarioSolana);
    } catch (e) {
      if (e !== "done") throw e;
    }
  });
});
