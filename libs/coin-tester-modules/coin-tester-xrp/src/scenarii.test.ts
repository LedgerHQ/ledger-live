import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killRippled } from "./rippled";
import { scenarioXrp } from "./scenarii/xrp";

jest.setTimeout(600_000);

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, async () => {
    await killRippled();
  }),
);

describe("XRP", () => {
  it("scenario xrp", async () => {
    try {
      await executeScenario(scenarioXrp);
    } catch (e) {
      if (e !== "done") {
        await killRippled();
        throw e;
      }
    }
  });
});
