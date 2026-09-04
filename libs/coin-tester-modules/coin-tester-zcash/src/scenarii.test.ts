// Test seam (must be registered before any other module transitively loads
// @ledgerhq/coin-zcash/network/ZCash -- jest.mock calls are hoisted to the top
// of the file by the swc/babel transform, so this runs first regardless of
// import order below). See zcashClientTestSeam.ts for what it does.
jest.mock("@ledgerhq/coin-zcash/network/ZCash", () => require("./zcashClientTestSeam"));

import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioZcash } from "./scenarii/zcash";
import { killRegtestNode } from "./regtestNode";

global.console = console;
// zaino has no published image -- its own docker-compose service builds it from
// source on every run (cargo install, see docker-compose.yml's own comment), which
// on a cold CI cache can take well past this file's previous 1_000_000ms (16.7 min)
// budget before the stack even reports healthy (confirmed: ~25 min on a cold run).
// Matches coin-tester-stacks' own 50-minute budget for a similarly build-heavy stack.
jest.setTimeout(50 * 60 * 1000);

describe("Zcash Deterministic Tester", () => {
  it("scenario Zcash", async () => {
    try {
      await executeScenario(scenarioZcash);
    } catch (e) {
      if (e != "done") {
        await killRegtestNode();
        throw e;
      }
    }
  });
});

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e, () => {
    killRegtestNode().catch(() => {});
  }),
);
