import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioXrp } from "./scenarii/xrp";

jest.setTimeout(600_000);

describe("XRP", () => {
  it("scenario xrp", async () => {
    try {
      await executeScenario(scenarioXrp);
    } catch (e) {
      if (e !== "done") throw e;
    }
  });
});
