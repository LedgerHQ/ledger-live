import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { scenarioBitcoin } from "./scenarii/bitcoin";
import { scenarioBitcoinGeneric } from "./scenarii/bitcoinGeneric";
import { killAtlas } from "./atlas";

global.console = console;
jest.setTimeout(1_000_000);

// describe("Bitcoin Deterministic Tester (legacy strategy)", () => {
//   it("scenario Bitcoin", async () => {
//     try {
//       await executeScenario(scenarioBitcoin);
//     } catch (e) {
//       if (e != "done") {
//         await killAtlas();
//         throw e;
//       }
//     }
//   });
// });

describe("Bitcoin Deterministic Tester (generic-adapter strategy)", () => {
  it("scenario Bitcoin generic-adapter simple send", async () => {
    try {
      await executeScenario(scenarioBitcoinGeneric, "generic-adapter");
    } catch (e) {
      if (e != "done") {
        await killAtlas();
        throw e;
      }
    }
  });
});

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(e =>
  process.on(e as any, () => {
    killAtlas().catch(() => {});
  }),
);
