import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killAnvil } from "./anvil";
import { scenarioEthereum } from "./scenarii/ethereum";
import { scenarioPolygon } from "./scenarii/polygon";
import { scenarioScroll } from "./scenarii/scroll";
import { scenarioBlast } from "./scenarii/blast";
import { scenarioSonic } from "./scenarii/sonic";
import { scenarioCore } from "./scenarii/core";
// Import tokenFixtures to setup mock store
import "./tokenFixtures";

global.console = require("console");
jest.setTimeout(100_000);

// Note this config runs with NanoX
// https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-tester/docker-compose.yml

describe("EVM Deterministic Tester", () => {
  it("scenario Ethereum", async () => {
    try {
      await executeScenario(scenarioEthereum);
    } catch (e) {
      if (e != "done") {
        await killAnvil();
        throw e;
      }
    }
  });

  it("scenario Sonic", async () => {
    try {
      await executeScenario(scenarioSonic);
    } catch (e) {
      if (e != "done") {
        await killAnvil();
        throw e;
      }
    }
  });

  it("scenario Polygon", async () => {
    try {
      await executeScenario(scenarioPolygon);
    } catch (e) {
      if (e != "done") {
        await killAnvil();
        throw e;
      }
    }
  });

  it("scenario Core", async () => {
    try {
      await executeScenario(scenarioCore);
    } catch (e) {
      if (e != "done") {
        await killAnvil();
        throw e;
      }
    }
  });

  it("scenario scroll", async () => {
    try {
      await executeScenario(scenarioScroll);
    } catch (e) {
      if (e != "done") {
        await killAnvil();
        throw e;
      }
    }
  });

  it("scenario blast", async () => {
    try {
      await executeScenario(scenarioBlast);
    } catch (e) {
      if (e != "done") {
        await killAnvil();
        throw e;
      }
    }
  });
});

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killAnvil();
  }),
);
