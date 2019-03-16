// @flow

import {
  isSegwitDerivationMode,
  getDerivationScheme,
} from "@ledgerhq/live-common/lib/derivation";
import type {
  CryptoCurrency,
  DerivationMode,
} from "@ledgerhq/live-common/lib/types";
import { atomicQueue } from "../logic/promise";
import type { Core, CoreWallet } from "./types";

export const getOrCreateWallet = atomicQueue(
  async ({
    core,
    walletName,
    currency,
    derivationMode,
  }: {
    core: Core,
    walletName: string,
    currency: CryptoCurrency,
    derivationMode: DerivationMode,
  }): Promise<CoreWallet> => {
    const poolInstance = core.getPoolInstance();
    let wallet;
    try {
      wallet = await poolInstance.getWallet(walletName);
    } catch (err) {
      const currencyCore = await poolInstance.getCurrency(currency.id);
      const config = await core.DynamicObject.newInstance();

      const derivationScheme = getDerivationScheme({
        currency,
        derivationMode,
      });

      if (isSegwitDerivationMode(derivationMode)) {
        await config.putString("KEYCHAIN_ENGINE", "BIP49_P2SH");
      }
      await config.putString("KEYCHAIN_DERIVATION_SCHEME", derivationScheme);

      wallet = await poolInstance.createWallet(
        walletName,
        currencyCore,
        config,
      );
    }
    return wallet;
  },
  ({ walletName }: { walletName: string }) => walletName,
);
