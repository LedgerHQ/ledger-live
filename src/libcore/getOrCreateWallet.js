// @flow

import { isSegwitDerivationMode, getDerivationScheme } from "../derivation";
import type { CryptoCurrency, DerivationMode } from "../types";
import { atomicQueue } from "../promise";
import type { Core, CoreWallet } from "./types";

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
    } catch (err) {
      const currencyCore = await poolInstance.getCurrency(currency.id);
      const config = await core.DynamicObject.newInstance();

      const derivationScheme = getDerivationScheme({
        currency,
        derivationMode
      });

      if (isSegwitDerivationMode(derivationMode)) {
        await config.putString("KEYCHAIN_ENGINE", "BIP49_P2SH");
      }
      await config.putString("KEYCHAIN_DERIVATION_SCHEME", derivationScheme);

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
