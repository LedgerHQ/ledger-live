import { killSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killAnvil } from "./anvil";
import { scenarioEthereum } from "./scenarios/ethereum";
import { scenarioPolygon } from "./scenarios/polygon";

global.console = require("console");
jest.setTimeout(100_000);

export const defaultNanoApp = { firmware: "2.2.3" as const, version: "1.10.4" as const };

describe("EVM Deterministic Tester", () => {
  it("scenario Ethereum", async () => {
    try {
      await executeScenario(scenarioEthereum);
    } catch (e) {
      if (e != "done") {
        await Promise.all([killSpeculos(), killAnvil()]);
        throw e;
      }
    }
  });

  it("scenario polygon", async () => {
    try {
      await executeScenario(scenarioPolygon);
    } catch (e) {
      if (e != "done") {
        await Promise.all([killSpeculos(), killAnvil()]);
        throw e;
      }
    }
  });
});

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await Promise.all([killSpeculos(), killAnvil()]);
  }),
);
