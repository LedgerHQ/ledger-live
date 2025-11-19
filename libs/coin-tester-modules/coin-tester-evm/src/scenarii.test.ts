import { killSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killAnvil } from "./anvil";
import { scenarioEthereum } from "./scenarii/ethereum";
import { scenarioPolygon } from "./scenarii/polygon";
import { scenarioScroll } from "./scenarii/scroll";
import { scenarioBlast } from "./scenarii/blast";
import { scenarioSonic } from "./scenarii/sonic";
import { scenarioCore } from "./scenarii/core";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";

global.console = require("console");
jest.setTimeout(100_000);

initializeLegacyTokens(addTokens);
setCryptoAssetsStoreForCoinFramework(legacyCryptoAssetsStore);

// Note this config runs with NanoX
// https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-tester/docker-compose.yml

describe.each([["legacy"], ["generic-adapter"]] as const)(
  "EVM Deterministic Tester (%s strategy)",
  strategy => {
    it("scenario Ethereum", async () => {
      try {
        await executeScenario(scenarioEthereum, strategy);
      } catch (e) {
        if (e != "done") {
          await Promise.all([killSpeculos(), killAnvil()]);
          throw e;
        }
      }
    });

    it("scenario Sonic", async () => {
      try {
        await executeScenario(scenarioSonic, strategy);
      } catch (e) {
        if (e != "done") {
          await Promise.all([killSpeculos(), killAnvil()]);
          throw e;
        }
      }
    });

    it("scenario polygon", async () => {
      try {
        await executeScenario(scenarioPolygon, strategy);
      } catch (e) {
        if (e != "done") {
          await Promise.all([killSpeculos(), killAnvil()]);
          throw e;
        }
      }
    });

    it("scenario Core", async () => {
      try {
        await executeScenario(scenarioCore, strategy);
      } catch (e) {
        if (e != "done") {
          await Promise.all([killSpeculos(), killAnvil()]);
          throw e;
        }
      }
    });

    it.skip("scenario scroll", async () => {
      try {
        await executeScenario(scenarioScroll);
      } catch (e) {
        if (e != "done") {
          await Promise.all([killSpeculos(), killAnvil()]);
          throw e;
        }
      }
    });

    it.skip("scenario blast", async () => {
      try {
        await executeScenario(scenarioBlast);
      } catch (e) {
        if (e != "done") {
          await Promise.all([killSpeculos(), killAnvil()]);
          throw e;
        }
      }
    });
  },
);

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await Promise.all([killSpeculos(), killAnvil()]);
  }),
);
