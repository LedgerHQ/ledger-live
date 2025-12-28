import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killChopsticksAndSidecar } from "./chopsticks-sidecar";
import { AssetHubScenario } from "./scenarii/AssetHub";
import { PolkadotScenario } from "./scenarii/Polkadot";

global.console = console;
jest.setTimeout(600_000);

describe("Polkadot Deterministic Tester", () => {
  it("scenario AssetHub", async () => {
    try {
      await executeScenario(AssetHubScenario);
    } catch (e) {
      if (e != "done") {
        await killChopsticksAndSidecar();
        throw e;
      }
    }
  });

  it("scenario Polkadot", async () => {
    try {
      await executeScenario(PolkadotScenario);
    } catch (e) {
      if (e != "done") {
        await killChopsticksAndSidecar();
        throw e;
      }
    }
  });
});

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killChopsticksAndSidecar();
  }),
);
