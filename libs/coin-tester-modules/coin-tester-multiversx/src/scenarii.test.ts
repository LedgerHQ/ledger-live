import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioMultiversx } from "./scenarii/multiversx";
import { killChainSimulator } from "./chainSimulator";
// Import fixtures to set up the mock crypto-assets store before the bridge runs.
import "./fixtures";

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, () => {
    killChainSimulator().catch(() => {});
  }),
);

describe.each([["legacy"], ["generic-adapter"]] as const)(
  "MultiversX Deterministic Tester (%s strategy)",
  strategy => {
    it("scenario MultiversX", async () => {
      try {
        await executeScenario(scenarioMultiversx, strategy);
      } catch (e) {
        if (e !== "done") {
          await killChainSimulator();
          throw e;
        }
      }
    });
  },
);
