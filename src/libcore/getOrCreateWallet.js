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

export const getOrCreateWallet = atomicQueue(
  async ({
    core,
    walletName,
    currency,
    derivationMode,
  }: {
    core: *,
    walletName: string,
    currency: CryptoCurrency,
    derivationMode: DerivationMode,
  }) => {
    const poolInstance = core.getPoolInstance();
    let wallet;
    try {
      wallet = await core.coreWalletPool.getWallet(poolInstance, walletName);
    } catch (err) {
      const currencyCore = await core.coreWalletPool.getCurrency(
        poolInstance,
        currency.id,
      );
      const config = await core.coreDynamicObject.newInstance();

      const derivationScheme = getDerivationScheme({
        currency,
        derivationMode,
      });

      if (isSegwitDerivationMode(derivationMode)) {
        await core.coreDynamicObject.putString(
          config,
          "KEYCHAIN_ENGINE",
          "BIP49_P2SH",
        );
      }
      await core.coreDynamicObject.putString(
        config,
        "KEYCHAIN_DERIVATION_SCHEME",
        derivationScheme,
      );

      wallet = await core.coreWalletPool.createWallet(
        poolInstance,
        walletName,
        currencyCore,
        config,
      );
    }
    return wallet;
  },
  ({ walletName }) => walletName,
);
