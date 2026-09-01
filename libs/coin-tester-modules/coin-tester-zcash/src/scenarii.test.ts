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
jest.setTimeout(1_000_000);

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
