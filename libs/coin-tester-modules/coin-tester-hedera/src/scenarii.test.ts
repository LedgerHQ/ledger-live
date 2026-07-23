import { executeScenario } from "@ledgerhq/coin-tester/main";
import { closeGenesisClient } from "./genesis";
import { deploySolo, teardownSolo } from "./solo";
import { scenarioHedera } from "./scenarii/hedera";
import { scenarioHederaToken } from "./scenarii/hederaToken";
import { scenarioHederaStaking } from "./scenarii/hederaStaking";

/** Solo cold start is 7–10 min; the hook gets its own budget so it is not charged to a scenario. */
const CLUSTER_BRING_UP_TIMEOUT_MS = 900_000;

// Per *test*, not per suite. Deploy is no longer inside a test, so a hung scenario fails in 6 min.
jest.setTimeout(360_000);

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, async () => {
    closeGenesisClient();
    await teardownSolo();
  }),
);

describe("Hedera", () => {
  // Cluster bring-up belongs to the environment, not to a scenario: in beforeAll a kube failure
  // reports as an environment failure instead of blaming whichever scenario happens to run first.
  beforeAll(async () => {
    await deploySolo();
  }, CLUSTER_BRING_UP_TIMEOUT_MS);

  // The three scenarios share one cluster, so no individual scenario may tear it down.
  afterAll(async () => {
    closeGenesisClient();
    await teardownSolo();
  });

  it("scenario hedera", () => executeScenario(scenarioHedera));
  it("scenario hedera token", () => executeScenario(scenarioHederaToken));
  it("scenario hedera staking", () => executeScenario(scenarioHederaStaking));
});
