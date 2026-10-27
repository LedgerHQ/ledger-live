import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioBitcoin } from "./scenarii/bitcoin";
import { scenarioBitcoinGeneric } from "./scenarii/bitcoinGeneric";

global.console = console;
jest.setTimeout(1_000_000);

async function run(execute: () => Promise<void>) {
  try {
    await execute();
  } catch (e) {
    if (e != "done") throw e;
  }
}

describe("Bitcoin Deterministic Tester", () => {
  it("scenario Bitcoin (legacy bridge)", () =>
    run(() => executeScenario(scenarioBitcoin, "legacy")));

  it("scenario Bitcoin (generic adapter, single address)", () =>
    run(() => executeScenario(scenarioBitcoinGeneric, "generic-adapter")));
});
