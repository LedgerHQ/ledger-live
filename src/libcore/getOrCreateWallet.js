// @flow

import { getKeychainEngine, getDerivationScheme } from "../derivation";
import type { CryptoCurrency, DerivationMode } from "../types";
import { atomicQueue } from "../promise";
import type { Core, CoreWallet } from "./types";
import { findCurrencyExplorer } from "../explorers";
import { getEnv } from "../env";

type F = ({
  core: Core,
  walletName: string,
  currency: CryptoCurrency,
  derivationMode: DerivationMode
}) => Promise<CoreWallet>;

export const getOrCreateWallet: F = atomicQueue(
  async ({ core, walletName, currency, derivationMode }) => {
    const poolInstance = core.getPoolInstance();
    let wallet;

    const keychainEngine = getKeychainEngine(derivationMode);
    const config = await core.DynamicObject.newInstance();
    if (keychainEngine) {
      await config.putString("KEYCHAIN_ENGINE", keychainEngine);
    }

    const derivationScheme = getDerivationScheme({ currency, derivationMode });
    await config.putString("KEYCHAIN_DERIVATION_SCHEME", derivationScheme);

    const ledgerExplorer = findCurrencyExplorer(currency);
    if (ledgerExplorer) {
      const endpoint = getEnv("EXPLORER");
      if (endpoint) {
        await config.putString("BLOCKCHAIN_EXPLORER_API_ENDPOINT", endpoint);
      }
      await config.putString(
        "BLOCKCHAIN_EXPLORER_VERSION",
        ledgerExplorer.version
      );
    }

    try {
      // check if wallet exists yet
      wallet = await poolInstance.getWallet(walletName);
    } catch (err) {
      // create it with the config
      const currencyCore = await poolInstance.getCurrency(currency.id);
      wallet = await poolInstance.createWallet(
        walletName,
        currencyCore,
        config
      );
      return wallet;
    }

    // if it existed, we still need to sync again the config in case it changed
    await poolInstance.updateWalletConfig(walletName, config);
    // and we need to get wallet again to have this config taken into account
    wallet = await poolInstance.getWallet(walletName);
    return wallet;
  },
  ({ walletName }: { walletName: string }) => walletName
);
