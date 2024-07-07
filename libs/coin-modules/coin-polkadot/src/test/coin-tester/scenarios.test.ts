import { killSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { basicScenario } from "./scenarios/basic";
import { killChopsticksAndSidecar } from "./chopsticks-sidecar";

global.console = require("console");
jest.setTimeout(300_000);

export const defaultNanoApp = { firmware: "2.3.0" as const, version: "100.0.5" as const };

describe("Polkadot Deterministic Tester", () => {
  it("Basic scenario", async () => {
    try {
      await executeScenario(basicScenario);
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
