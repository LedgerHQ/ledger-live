import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioTon } from "./scenarii/ton";

global.console = console;
jest.setTimeout(600_000);

describe.each([["legacy"], ["generic-adapter"]] as const)(
  "TON Deterministic Tester (%s strategy)",
  strategy => {
    it("scenario TON", () => executeScenario(scenarioTon, strategy));
  },
);
