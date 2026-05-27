import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioFilecoin } from "./scenarii/filecoin";
import { killLotus } from "./lotus";

global.console = require("console");
jest.setTimeout(600_000);

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killLotus();
  }),
);

describe("Filecoin Deterministic Tester", () => {
  it("scenario Filecoin", async () => {
    try {
      await executeScenario(scenarioFilecoin);
    } catch (e) {
      if (e !== "done") {
        await killLotus();
        throw e;
      }
    }
  });
});
