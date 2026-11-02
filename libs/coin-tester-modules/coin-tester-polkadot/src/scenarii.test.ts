import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { AssetHubScenario } from "./scenarii/AssetHub";
import { PolkadotScenario } from "./scenarii/Polkadot";

global.console = console;
jest.setTimeout(600_000);

describe("Polkadot Deterministic Tester", () => {
  it("scenario AssetHub", async () => {
    try {
      await executeScenario(AssetHubScenario);
    } catch (e) {
      if (e != "done") throw e;
    }
  });

  it("scenario Polkadot", async () => {
    try {
      await executeScenario(PolkadotScenario);
    } catch (e) {
      if (e != "done") throw e;
    }
  });
});
