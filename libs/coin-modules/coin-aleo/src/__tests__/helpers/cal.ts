import { buildStandaloneCryptoAssetsStore } from "@features/platform-currencies/legacy";
import {
  setCryptoAssetsStore,
  type FrameworkCryptoAssetsStore,
} from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

/**
 * Registers a standalone CAL (Crypto Assets List) store for *.integ.test.ts files that
 * exercise code paths depending on it (currency/token lookups). Points at the real CAL
 * service by default; override via CAL_SERVICE_URL / LEDGER_CLIENT_VERSION env vars.
 */
export const setupCalStore = (): void => {
  setCryptoAssetsStore(
    buildStandaloneCryptoAssetsStore({
      calServiceUrl: process.env.CAL_SERVICE_URL ?? "https://global.api.prd.ledger.com/cal",
      ledgerClientVersion: process.env.LEDGER_CLIENT_VERSION || "coin-aleo-integration-test",
    }) as unknown as FrameworkCryptoAssetsStore,
  );
};
