import { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { executeScenario, Scenario } from "@ledgerhq/coin-tester/main";
import { killAnvil } from "./anvil";
import { scenarioEthereum } from "./scenarii/ethereum";
import { scenarioPolygon } from "./scenarii/polygon";
import { scenarioScroll } from "./scenarii/scroll";
import { scenarioBlast } from "./scenarii/blast";
import { scenarioBase } from "./scenarii/base";
import { scenarioSonic } from "./scenarii/sonic";
import { scenarioCore } from "./scenarii/core";
import { scenarioBnb } from "./scenarii/bnb";
import { scenarioArcTestnetNative } from "./scenarii/arc_testnet";
// Import tokenFixtures to setup mock store
import "./tokenFixtures";

global.console = require("console");
jest.setTimeout(300_000);

const safeExecuteScenario = async (
  scenario: Scenario<GenericTransaction, Account>,
): Promise<void> => {
  try {
    await executeScenario(scenario);
  } catch (e) {
    if (e !== "done") {
      await killAnvil();
      throw e;
    }
  }
};

describe("EVM Deterministic Tester", () => {
  it("scenario Ethereum", () => safeExecuteScenario(scenarioEthereum));
  it("scenario Sonic", () => safeExecuteScenario(scenarioSonic));
  it("scenario Polygon", () => safeExecuteScenario(scenarioPolygon));
  it("scenario Core", () => safeExecuteScenario(scenarioCore));
  it("scenario Scroll", () => safeExecuteScenario(scenarioScroll));
  it("scenario Blast", () => safeExecuteScenario(scenarioBlast));
  it("scenario Base", () => safeExecuteScenario(scenarioBase));
  it("scenario BNB (BSC)", () => safeExecuteScenario(scenarioBnb));
  it("scenario Arc Testnet", () => safeExecuteScenario(scenarioArcTestnetNative));
});

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killAnvil();
  }),
);
