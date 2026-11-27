import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioTezosTz1, scenarioTezosTz2 } from "./scenarii/tezos";

global.console = require("console");
jest.setTimeout(600_000);

describe("Tezos Deterministic Tester", () => {
  it("scenario Tezos (tz1 / ed25519)", async () => {
    try {
      await executeScenario(scenarioTezosTz1);
    } catch (e) {
      if (e !== "done") throw e;
    }
  });

  it("scenario Tezos (tz2 / secp256k1)", async () => {
    try {
      await executeScenario(scenarioTezosTz2);
    } catch (e) {
      if (e !== "done") throw e;
    }
  });
});
