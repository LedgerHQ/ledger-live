import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioSolana } from "./scenarii/solana";
import { killAgave } from "./agave";
// Import fixtures to setup mock store
import "./fixtures";

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, () => {
    killAgave().catch(() => {});
  }),
);

// mainnet guards what production runs, devnet catches upcoming Agave versions and feature activations
describe.each(["mainnet", "devnet"] as const)(
  "Solana Deterministic Tester (%s cluster)",
  cluster => {
    it("scenario Solana", async () => {
      try {
        await executeScenario(scenarioSolana(cluster), "generic-adapter");
      } catch (e) {
        if (e !== "done") {
          await killAgave();
          throw e;
        }
      }
    });
  },
);
