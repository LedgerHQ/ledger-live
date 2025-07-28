import { killSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killAnvil } from "./anvil";
import { scenarioEthereum } from "./scenarii/ethereum";
import { scenarioPolygon } from "./scenarii/polygon";
import { scenarioScroll } from "./scenarii/scroll";
import { scenarioBlast } from "./scenarii/blast";
import { scenarioSonic } from "./scenarii/sonic";

global.console = require("console");
jest.setTimeout(100_000);

// Note this config runs with NanoX
// https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-tester/docker-compose.yml
export const defaultNanoApp = { firmware: "2.4.1" as const, version: "1.15.0" as const };

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

  it("scenario Sonic", async () => {
    try {
      await executeScenario(scenarioSonic);
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

  it.skip("scenario scroll", async () => {
    try {
      await executeScenario(scenarioScroll);
    } catch (e) {
      if (e != "done") {
        await Promise.all([killSpeculos(), killAnvil()]);
        throw e;
      }
    }
  });

  it.skip("scenario blast", async () => {
    try {
      await executeScenario(scenarioBlast);
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
