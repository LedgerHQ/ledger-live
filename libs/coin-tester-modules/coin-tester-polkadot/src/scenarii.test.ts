import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { killChopsticksAndSidecar } from "./chopsticks-sidecar";
import { PolkadotScenario } from "./scenarii/Polkadot";
import { WestendScenario } from "./scenarii/Westend";

global.console = console;
jest.setTimeout(300_000);

describe("Polkadot Deterministic Tester", () => {
  it("scenario Polkadot", async () => {
    try {
      await executeScenario(PolkadotScenario);
    } catch (e) {
      if (e != "done") {
        await Promise.all([killSpeculos(), killChopsticksAndSidecar()]);
        throw e;
      }
    }
  });

  it.skip("scenario Westend", async () => {
    try {
      await executeScenario(WestendScenario);
    } catch (e) {
      if (e != "done") {
        await Promise.all([killSpeculos(), killChopsticksAndSidecar()]);
        throw e;
      }
    }
  });
});

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await Promise.all([killSpeculos(), killChopsticksAndSidecar()]);
  }),
);
