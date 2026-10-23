import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioTon } from "./scenarii/ton";

global.console = console;
jest.setTimeout(600_000);

describe("TON Deterministic Tester", () => {
  it("scenario TON (generic adapter)", () => executeScenario(scenarioTon, "generic-adapter"));
});
