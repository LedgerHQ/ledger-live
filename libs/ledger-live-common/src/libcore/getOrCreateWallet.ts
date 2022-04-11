import { getLibcoreConfig, getDerivationScheme } from "../derivation";
import type { CryptoCurrency, DerivationMode } from "../types";
import { atomicQueue } from "../promise";
import type { Core, CoreWallet } from "./types";
import { findCurrencyExplorer } from "../api/Ledger";
import { getEnv } from "../env";
import { isAlreadyExistingWalletError } from "./errors";

type Param = {
  core: Core;
  walletName: string;
  currency: CryptoCurrency;
  derivationMode: DerivationMode;
};

type F = (arg0: Param) => Promise<CoreWallet>;

export const getOrCreateWallet: F = atomicQueue(
  async ({ core, walletName, currency, derivationMode }: Param) => {
    const poolInstance = core.getPoolInstance();
    let wallet;
    const config = await core.DynamicObject.newInstance();
    const configExtra = getLibcoreConfig(currency, derivationMode);

    if (configExtra) {
      for (const k in configExtra) {
        const v = configExtra[k];

        if (typeof v === "string") {
          await config.putString(k, v);
        }
      }
    }

    const derivationScheme = getDerivationScheme({
      currency,
      derivationMode,
    });
    await config.putString("KEYCHAIN_DERIVATION_SCHEME", derivationScheme);
    await config.putBoolean(
      "DEACTIVATE_SYNC_TOKEN",
      getEnv("DISABLE_SYNC_TOKEN")
    );
    const KEYCHAIN_OBSERVABLE_RANGE = getEnv("KEYCHAIN_OBSERVABLE_RANGE");

    if (KEYCHAIN_OBSERVABLE_RANGE) {
      await config.putInt(
        "KEYCHAIN_OBSERVABLE_RANGE",
        KEYCHAIN_OBSERVABLE_RANGE
      );
    }

    const ledgerExplorer = findCurrencyExplorer(currency);

    if (ledgerExplorer) {
      const endpoint = ledgerExplorer.endpoint;

      if (endpoint) {
        await config.putString("BLOCKCHAIN_EXPLORER_API_ENDPOINT", endpoint);
      }

      await config.putString(
        "BLOCKCHAIN_EXPLORER_VERSION",
        ledgerExplorer.version
      );
    }

    try {
      // create it with the config
      const currencyCore = await poolInstance.getCurrency(currency.id);
      wallet = await poolInstance.createWallet(
        walletName,
        currencyCore,
        config
      );
      return wallet;
    } catch (err: any) {
      if (!isAlreadyExistingWalletError(err)) {
        throw err;
      }

      // actually wallet was existing...
      // we need to sync the config in case it changed
      await poolInstance.updateWalletConfig(walletName, config);
    }

    wallet = await poolInstance.getWallet(walletName);
    return wallet;
  },
  ({ walletName }: { walletName: string }) => walletName
);
