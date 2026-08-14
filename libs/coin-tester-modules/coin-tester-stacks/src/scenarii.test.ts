import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killDevnet } from "./devnet";
import { scenarioStacks, scenarioStacksStaking } from "./scenarii/stacks";

global.console = require("console");
// Clarinet devnet boot (bitcoind + stacks-node + stacks-signer + the bundled
// stacks-blockchain-api/Postgres pair) plus real block confirmations is slower than VeChain's
// single-container thor-solo; budget generously. Must stay comfortably above the inner
// `waitForContractDeployment` timeouts (15 min for the send scenario's token, 25 min for the
// staking scenario's epoch-4.0-gated signer-manager-stub, `scenarii/stacks.ts`) plus the per-
// transaction retry budget (up to 7.5 min each, `retryLimit`/`retryInterval`) and the staking
// scenario's own signer-manager setup (two more confirmed transactions) -- or this outer limit
// would cut a scenario off before its own, more specific timeouts get a chance to.
jest.setTimeout(50 * 60 * 1000);

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, async () => {
    await killDevnet();
  }),
);

// The send/SIP-010 scenario only runs "legacy" here: `helpers.ts` also supports
// "generic-adapter" for it, but re-running the same 4-transaction scenario a second time under
// that strategy isn't exercised by this suite yet -- pox-5 staking below is generic-adapter-only
// (the legacy bridge has no staking code at all), so it gets its own scenario/devnet lifecycle.
describe("Stacks (legacy strategy)", () => {
  it("scenario stacks", async () => {
    try {
      await executeScenario(scenarioStacks, "legacy");
    } catch (e) {
      if (e !== "done") {
        await killDevnet();
        throw e;
      }
    }
  });
});

describe("Stacks staking (generic-adapter strategy)", () => {
  it("scenario stacks staking", async () => {
    try {
      await executeScenario(scenarioStacksStaking, "generic-adapter");
    } catch (e) {
      if (e !== "done") {
        await killDevnet();
        throw e;
      }
    }
  });
});
