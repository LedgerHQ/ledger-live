import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killDevnet, spawnDevnet } from "./devnet";
import { scenarioStacks, scenarioStacksStaking } from "./scenarii/stacks";

global.console = require("console");
// Per-scenario budget. A scenario takes well under a minute on the snapshot-booted devnet
// (`spawnDevnet`); 20 minutes stays above its own contract wait (5 min, `scenarii/stacks.ts`) and
// several transactions' worth of indexer retries (up to 7.5 min each, `retryLimit`/
// `retryInterval`), so a stuck scenario fails on its own, more specific timeout first.
jest.setTimeout(20 * 60 * 1000);

// One devnet for every scenario below. Scenarios share the chain but never an account -- each
// signs with its own sender (`fixtures.ts`'s `SENDER_PRIVATE_KEYS`, `STAKER_PRIVATE_KEY`), so none
// starts on another's history or drained balance.
// 30 minutes: when the patched clarinet binary isn't cached yet, `spawnDevnet` first builds it
// (~13 min in CI) and only then starts its own 5-minute boot deadline.
beforeAll(() => spawnDevnet(), 30 * 60 * 1000);
afterAll(() => killDevnet());

// `exit` deliberately excluded: its handler must be synchronous (the event loop is already
// unwinding), so an `await killDevnet()` there would never get a chance to finish. Signals and
// uncaught exceptions can do async cleanup, but registering a handler for them suppresses Node's
// default terminate-the-process behavior -- without an explicit `process.exit(1)` after cleanup,
// the process would just keep running afterward instead of actually exiting, potentially hanging
// Jest/CI instead of failing fast.
["SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, async () => {
    await killDevnet();
    process.exit(1);
  }),
);

// The send/SIP-010 scenario runs through both strategies (mirrors coin-tester-vechain/near):
// `helpers.ts`'s `adaptLegacyBridge` wraps the legacy bridge behind the same
// `AccountBridge<GenericTransaction>` shape the generic-adapter path already exposes, so the
// identical 4-transaction scenario exercises both `coin-stacks`'s legacy bridge and its Alpaca
// (CoinModuleApi) transfer path, each strategy with its own sender. Staking below is
// generic-adapter-only (the legacy bridge has no staking code at all), so it is a separate
// scenario with its own staker.
describe.each([["legacy"], ["generic-adapter"]] as const)("Stacks (%s strategy)", strategy => {
  it("scenario stacks", async () => {
    try {
      await executeScenario(
        { ...scenarioStacks, name: `${scenarioStacks.name} [${strategy} strategy]` },
        strategy,
      );
    } catch (e) {
      // No `killDevnet()` here: later scenarios still need the shared devnet; `afterAll` tears it
      // down (and dumps container diagnostics under `DEBUG`).
      if (e !== "done") throw e;
    }
  });
});

describe("Stacks staking (generic-adapter strategy)", () => {
  it("scenario stacks staking", async () => {
    try {
      await executeScenario(scenarioStacksStaking, "generic-adapter");
    } catch (e) {
      // No `killDevnet()` here: later scenarios still need the shared devnet; `afterAll` tears it
      // down (and dumps container diagnostics under `DEBUG`).
      if (e !== "done") throw e;
    }
  });
});
