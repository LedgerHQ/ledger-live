import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioInternetComputer } from "./scenarii/internetComputer";

global.console = console;
jest.setTimeout(600_000);

describe("Internet Computer Deterministic Tester (legacy strategy)", () => {
  it("scenario Internet Computer", () => executeScenario(scenarioInternetComputer, "legacy"));
});
