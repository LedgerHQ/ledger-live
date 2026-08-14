import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killDevnet } from "./devnet";
import { scenarioStacks } from "./scenarii/stacks";

global.console = require("console");
// Clarinet devnet boot (bitcoind + stacks-node + stacks-signer + the bundled
// stacks-blockchain-api/Postgres pair) plus real block confirmations is slower than VeChain's
// single-container thor-solo; budget generously. Must stay comfortably above the inner
// `waitForContractDeployment` timeout (15 min at the 10s-per-block cadence, `scenarii/stacks.ts`)
// plus the per-transaction retry budget (up to 7.5 min each, `retryLimit`/`retryInterval`) or this
// outer limit would cut the scenario off before its own, more specific timeouts get a chance to.
jest.setTimeout(30 * 60 * 1000);

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, async () => {
    await killDevnet();
  }),
);

// Single strategy only: `coin-stacks` has no `generic-adapter` path on this branch (see
// `src/helpers.ts`), so there is no second strategy to `describe.each` over yet.
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
