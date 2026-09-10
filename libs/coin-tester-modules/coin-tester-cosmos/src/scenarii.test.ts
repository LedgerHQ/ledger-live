import console from "console";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killBabylond } from "./babylond";
import { killGaiad } from "./gaiad";
import { killInferenced } from "./inferenced";
import { BabylonScenario } from "./scenarii/Babylon";
import { CosmosScenario } from "./scenarii/Cosmos";
import { GonkaScenario } from "./scenarii/Gonka";

global.console = console;
jest.setTimeout(600_000);

describe.each([["legacy"], ["generic-adapter"]] as const)(
  "Cosmos Tester (%s strategy)",
  strategy => {
    it("scenario Babylon", async () => {
      try {
        await executeScenario(BabylonScenario, strategy);
      } catch (e) {
        if (e !== "done") {
          await killBabylond();
          throw e;
        }
      }
    });

    it("scenario Cosmos", async () => {
      try {
        await executeScenario(CosmosScenario, strategy);
      } catch (e) {
        if (e !== "done") {
          await killGaiad();
          throw e;
        }
      }
    });

    it("scenario Gonka", async () => {
      try {
        await executeScenario(GonkaScenario, strategy);
      } catch (e) {
        if (e !== "done") {
          await killInferenced();
          throw e;
        }
      }
    });
  },
);

// `exit` (and some signal paths) won't await pending promises, so the handler
// must trigger teardown synchronously rather than awaiting it. Tear down every
// devnet — whichever scenario was mid-run, its containers must not leak.
["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].forEach(
  event => {
    process.on(event, () => {
      // Swallow rejections: a failed teardown here must not become an
      // unhandledRejection that masks the original error.
      void killBabylond().catch(() => {});
      void killGaiad().catch(() => {});
      void killInferenced().catch(() => {});
    });
  },
);
