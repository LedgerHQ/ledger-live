import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killTronQuickstart } from "./tronQuickstart";
import { scenarioTron } from "./scenarii/tron";

global.console = require("console");
jest.setTimeout(600_000);

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, async () => {
    await killTronQuickstart();
  }),
);

describe.each([["legacy"], ["generic-adapter"]] as const)("Tron (%s strategy)", strategy => {
  it("scenario full", async () => {
    try {
      await executeScenario(scenarioTron, strategy);
    } catch (e) {
      if (e !== "done") {
        await killTronQuickstart();
        throw e;
      }
    }
  });
});
