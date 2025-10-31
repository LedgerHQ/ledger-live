/* istanbul ignore file: pure exports, bridge tested by live-common with bridge.integration.test.ts */
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type {
  AccountBridge,
  Bridge,
  CurrencyBridge,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { CryptoAssetsStoreGetter } from "@ledgerhq/types-live";
import type { Observable } from "rxjs";
import { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import type { Transaction as EvmTransaction } from "../types/index";
import { setCoinConfig, type CoinConfig } from "../config";
import type { EvmSigner } from "../types/signer";
import resolver from "../hw-getAddress";
import { setCryptoAssetsStoreGetter } from "../cryptoAssetsStore";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { getAccountShape, postSync, sync } from "./synchronization";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import { buildSignOperation } from "./signOperation";
import nftResolvers from "./nftResolvers";
import { broadcast } from "./broadcast";

export function buildCurrencyBridge(signerContext: SignerContext<EvmSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
    postSync,
  });

  return {
    preload: (_currency: Currency): Promise<void> => Promise.resolve(),
    hydrate: (_data: unknown, _currency: CryptoCurrency): void => {},
    scanAccounts,
    nftResolvers,
    getPreloadStrategy: () => ({
      preloadMaxAge: 24 * 60 * 60 * 1000, // 1 day cache
    }),
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<EvmSigner>,
): AccountBridge<EvmTransaction> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    createTransaction,
    updateTransaction: updateTransaction<EvmTransaction>,
    prepareTransaction,
    getTransactionStatus,
    sync,
    receive,
    signOperation,
    signRawOperation: (): Observable<SignOperationEvent> => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    estimateMaxSpendable,
    getSerializedAddressParameters,
  };
}

export function createBridges(
  signerContext: SignerContext<EvmSigner>,
  coinConfig: CoinConfig,
  cryptoAssetsStoreGetter: CryptoAssetsStoreGetter,
): Bridge<EvmTransaction> {
  setCoinConfig(coinConfig);
  setCryptoAssetsStoreGetter(cryptoAssetsStoreGetter);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
