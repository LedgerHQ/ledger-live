import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioBitcoin } from "./scenarii/bitcoin";
import { scenarioBitcoinGeneric } from "./scenarii/bitcoinGeneric";
import { killAtlas } from "./atlas";

global.console = console;
jest.setTimeout(1_000_000);

async function run(execute: () => Promise<void>) {
  try {
    await execute();
  } catch (e) {
    if (e != "done") {
      await killAtlas();
      throw e;
    }
  }
}

describe("Bitcoin Deterministic Tester", () => {
  it("scenario Bitcoin (legacy bridge)", () => run(() => executeScenario(scenarioBitcoin)));

  it("scenario Bitcoin (generic adapter, single address)", () =>
    run(() => executeScenario(scenarioBitcoinGeneric, "generic-adapter")));
});

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e as any, () => {
    killAtlas().catch(() => {});
  }),
);
