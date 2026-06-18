import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioStellar } from "./scenarii/stellar";
import { killStellarQuickstart } from "./stellar-quickstart";

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killStellarQuickstart();
  }),
);

describe("Stellar Deterministic Tester", () => {
  it("scenario Stellar", async () => {
    try {
      await executeScenario(scenarioStellar);
    } catch (e) {
      if (e !== "done") {
        await killStellarQuickstart();
        throw e;
      }
    }
  });
});
