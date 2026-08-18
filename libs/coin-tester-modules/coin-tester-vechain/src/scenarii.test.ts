import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killThorNode } from "./thorNode";
import { scenarioVechain } from "./scenarii/vechain";

global.console = require("console");
jest.setTimeout(600_000);

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, async () => {
    await killThorNode();
  }),
);

describe.each([["legacy"], ["generic-adapter"]] as const)("VeChain (%s strategy)", strategy => {
  it("scenario vechain", async () => {
    try {
      await executeScenario(
        { ...scenarioVechain, name: `${scenarioVechain.name} [${strategy} strategy]` },
        strategy,
      );
    } catch (e) {
      if (e !== "done") {
        await killThorNode();
        throw e;
      }
    }
  });
});
