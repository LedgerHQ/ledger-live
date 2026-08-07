import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killSandbox, scenarioNear } from "./scenarii/near";

// Both strategies run the same 6-transaction scenario end to end (sandbox startup, staking pool
// deploy, epoch fast-forward); the default 5s is nowhere near enough for either.
jest.setTimeout(20 * 60 * 1000);

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, () => {
    void killSandbox().catch(() => {});
  }),
);

describe.each([["legacy"], ["generic-adapter"]] as const)(
  "NEAR Deterministic Tester (%s strategy)",
  strategy => {
    it("scenario NEAR", async () => {
      await executeScenario(scenarioNear, strategy);
    });
  },
);
