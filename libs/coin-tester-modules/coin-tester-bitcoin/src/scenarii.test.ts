import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioBitcoin } from "./scenarii/bitcoin";
import { scenarioBitcoinGeneric } from "./scenarii/bitcoinGeneric";

// Force Node's console so logs stream live instead of being buffered by Jest.
global.console = console;

// Atlas (the dockerized Bitcoin regtest backend) is started/stopped by each scenario's
// own setup/teardown, and atlas.ts registers process-signal handlers so an interrupted
// run is torn down too — nothing to clean up from here.
jest.setTimeout(1_000_000);

describe.each([
  ["legacy", "scenario Bitcoin", () => executeScenario(scenarioBitcoin, "legacy")],
  [
    "generic-adapter",
    "scenario Bitcoin generic-adapter simple send",
    () => executeScenario(scenarioBitcoinGeneric, "generic-adapter"),
  ],
] as const)("Bitcoin Deterministic Tester (%s strategy)", (_strategy, name, run) => {
  it(name, () => run());
});
