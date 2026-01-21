import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioBitcoin } from "./scenarii/bitcoin";
import { killAtlas } from "./atlas";

global.console = console;
jest.setTimeout(1_000_000);

describe("Bitcoin Deterministic Tester", () => {
  it("scenario Bitcoin", async () => {
    try {
      await executeScenario(scenarioBitcoin);
    } catch (e) {
      if (e != "done") {
        await killAtlas();
        throw e;
      }
    }
  });
});

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killAtlas();
  }),
);
