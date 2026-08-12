import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioCasper } from "./scenarii/casper";

global.console = console;
jest.setTimeout(600_000);

describe("Casper Deterministic Tester", () => {
  it("scenario Casper", async () => {
    try {
      await executeScenario(scenarioCasper);
    } catch (e) {
      if (e !== "done") {
        throw e;
      }
    }
  });
});
