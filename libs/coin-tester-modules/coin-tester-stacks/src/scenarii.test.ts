import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killDevnet, spawnDevnet } from "./devnet";
import { scenarioStacks, scenarioStacksStaking } from "./scenarii/stacks";

global.console = require("console");
// Per-scenario budget. Real block confirmations on a Clarinet devnet are slow; this must stay
// comfortably above the inner `waitForContractDeployment` timeouts (15 min for the send
// scenario's token, 25 min for the staking scenario's epoch-4.0-gated signer-manager-stub,
// `scenarii/stacks.ts`) plus the per-transaction retry budget (up to 7.5 min each,
// `retryLimit`/`retryInterval`) and the staking scenario's own signer-manager setup (two more
// confirmed transactions) -- or this outer limit would cut a scenario off before its own, more
// specific timeouts get a chance to.
jest.setTimeout(50 * 60 * 1000);

// One devnet for every scenario below, instead of one booted from genesis per scenario: each boot
// and its wait for the contract batches cost minutes of 10s blocks. Scenarios share the chain but
// never an account -- each signs with its own sender (`fixtures.ts`'s `SENDER_PRIVATE_KEYS`,
// `STAKER_PRIVATE_KEY`), so none starts on another's history or drained balance.
// `spawnDevnet`'s own boot deadline is 15 min; the extra 5 covers the clarinet binary build when
// it isn't cached yet.
beforeAll(() => spawnDevnet(), 20 * 60 * 1000);
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
// scenario with its own staker. Order matters only for timing: the staking scenario's wait for
// epoch 4.0 runs after the send scenarios instead of from a fresh boot.
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
