import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killTronbox } from "./tronbox";
import { scenarioTron } from "./scenarii/tron";

global.console = require("console");
jest.setTimeout(600_000);

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, async () => {
    await killTronbox();
  }),
);

describe("Tron", () => {
  it("scenario tron", async () => {
    try {
      await executeScenario(scenarioTron, "legacy");
    } catch (e) {
      if (e !== "done") {
        await killTronbox();
        throw e;
      }
    }
  });
});
