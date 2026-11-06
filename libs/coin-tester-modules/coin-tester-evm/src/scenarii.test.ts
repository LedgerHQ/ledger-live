import { Account } from "@ledgerhq/types-live";
import type { GenericTransaction } from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { executeScenario, Scenario } from "@ledgerhq/coin-tester/main";
import { scenarioEthereum } from "./scenarii/ethereum";
import { scenarioPolygon } from "./scenarii/polygon";
import { scenarioScroll } from "./scenarii/scroll";
import { scenarioOptimism } from "./scenarii/optimism";
import { scenarioBase } from "./scenarii/base";
import { scenarioSonic } from "./scenarii/sonic";
import { scenarioCore } from "./scenarii/core";
import { scenarioBnb } from "./scenarii/bnb";
import { scenarioArc } from "./scenarii/arc";
import { scenarioRobinhood } from "./scenarii/robinhood";
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
  it("scenario Optimism", () => safeExecuteScenario(scenarioOptimism));
  it("scenario Base", () => safeExecuteScenario(scenarioBase));
  it("scenario BNB (BSC)", () => safeExecuteScenario(scenarioBnb));
  it("scenario Arc", () => safeExecuteScenario(scenarioArc));
  it("scenario Robinhood", () => safeExecuteScenario(scenarioRobinhood));
});
