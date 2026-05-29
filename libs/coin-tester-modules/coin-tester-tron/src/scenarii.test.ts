import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioTron } from "./scenarii/tron";
import { killNode } from "./node";

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map((e) =>
  process.on(e, async () => {
    await killNode();
  }),
);

describe("Tron Deterministic Tester", () => {
  it("scenario Tron (TRX + TRC-10 + TRC-20)", async () => {
    try {
      await executeScenario(scenarioTron);
    } catch (e) {
      if (e !== "done") {
        await killNode();
        throw e;
      }
    }
  });
});
