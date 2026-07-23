import { executeScenario } from "@ledgerhq/coin-tester/main";
import { teardownSolo } from "./solo";
import { scenarioHedera } from "./scenarii/hedera";

jest.setTimeout(1_200_000); // 20 min — Solo cold start can approach the 10-min ceiling other modules use.

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, async () => {
    await teardownSolo();
  }),
);

describe("Hedera", () => {
  it("scenario hedera", async () => {
    try {
      await executeScenario(scenarioHedera);
    } catch (e) {
      if (e !== "done") {
        await teardownSolo();
        throw e;
      }
    }
  });
});
