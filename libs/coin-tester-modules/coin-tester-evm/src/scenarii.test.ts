import { killSpeculos } from "@ledgerhq/coin-tester/signers/speculos";
import { executeScenario } from "@ledgerhq/coin-tester/main";
import { killAnvil } from "./anvil";
import { scenarioEthereum } from "./scenarii/ethereum";
import { scenarioPolygon } from "./scenarii/polygon";
import { scenarioScroll } from "./scenarii/scroll";
import { scenarioBlast } from "./scenarii/blast";
import { scenarioSonic } from "./scenarii/sonic";
import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import * as legacy from "@ledgerhq/cryptoassets/tokens";

global.console = require("console");
jest.setTimeout(100_000);

//TODO mock call to CAL when available
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStoreForCoinFramework({
  findTokenByAddress: legacy.findTokenByAddress,
  getTokenById: legacy.getTokenById,
  findTokenById: legacy.findTokenById,
  findTokenByAddressInCurrency: legacy.findTokenByAddressInCurrency,
  findTokenByTicker: legacy.findTokenByTicker,
} as CryptoAssetsStore);

// Note this config runs with NanoX
// https://github.com/LedgerHQ/ledger-live/blob/develop/libs/coin-tester/docker-compose.yml
export const defaultNanoApp = { firmware: "2.4.2" as const, version: "1.17.0" as const };

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
