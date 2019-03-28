// @flow

import { getKeychainEngine, getDerivationScheme } from "../derivation";
import type { CryptoCurrency, DerivationMode } from "../types";
import { atomicQueue } from "../promise";
import type { Core, CoreWallet } from "./types";
import { getCurrencyExplorer } from "../explorers";
import { blockchainExplorerEndpoint } from "../api/Ledger";

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
    try {
      wallet = await poolInstance.getWallet(walletName);
      // TODO seen with khalil:
      // TODO we need to check the explorer config set on that wallet have not changed! <- we miss this feature from libcore.
      // TODO if it have, we need to call poolInstance.changeWalletConfig and then, getWallet again
    } catch (err) {
      const currencyCore = await poolInstance.getCurrency(currency.id);
      const config = await core.DynamicObject.newInstance();

      const ledgerExplorer = getCurrencyExplorer(currency);
      const endpoint = blockchainExplorerEndpoint(currency);

      const derivationScheme = getDerivationScheme({
        currency,
        derivationMode
      });

      const keychainEngine = getKeychainEngine(derivationMode);
      if (keychainEngine) {
        await config.putString("KEYCHAIN_ENGINE", keychainEngine);
      }
      await config.putString("KEYCHAIN_DERIVATION_SCHEME", derivationScheme);

      if (blockchainExplorerEndpoint) {
        await config.putString("BLOCKCHAIN_EXPLORER_API_ENDPOINT", endpoint);
      }
      await config.putString(
        "BLOCKCHAIN_EXPLORER_VERSION",
        ledgerExplorer.version
      );

      wallet = await poolInstance.createWallet(
        walletName,
        currencyCore,
        config
      );
    }
    return wallet;
  },
  ({ walletName }: { walletName: string }) => walletName
);
