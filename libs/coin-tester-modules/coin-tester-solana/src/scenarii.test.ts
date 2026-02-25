import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioSolana } from "./scenarii/solana";
import { killAgave } from "./agave";
// Import fixtures to setup mock store
import "./fixtures";

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killAgave();
  }),
);

describe("Solana Deterministic Tester", () => {
  it("scenario Solana", async () => {
    try {
      await executeScenario(scenarioSolana);
    } catch (e) {
      if (e !== "done") {
        await killAgave();
        throw e;
      }
    }
  });
});
