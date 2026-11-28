import type { Account, TransactionCommon } from "@ledgerhq/types-live";
import { executeScenario, type Scenario } from "@ledgerhq/coin-tester/main";
import { scenarioXrp } from "./scenarii/xrp";
import { scenarioXrpIou } from "./scenarii/xrpIou";
import { scenarioXrpMpt } from "./scenarii/xrpMpt";

jest.setTimeout(600_000);

async function safeExecuteScenario<T extends TransactionCommon>(scenario: Scenario<T, Account>) {
  try {
    await executeScenario(scenario);
  } catch (e) {
    if (e !== "done") throw e;
  }
}

describe("XRP", () => {
  it("scenario xrp", () => safeExecuteScenario(scenarioXrp));
  it("scenario xrp iou", () => safeExecuteScenario(scenarioXrpIou));
  it("scenario xrp mpt", () => safeExecuteScenario(scenarioXrpMpt));
});
