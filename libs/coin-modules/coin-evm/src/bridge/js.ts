/* istanbul ignore file: pure exports, bridge tested by live-common with bridge.integration.test.ts */
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, Bridge, CurrencyBridge } from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { CryptoAssetsStoreGetter } from "@ledgerhq/types-live";
import type { Transaction as EvmTransaction } from "../types/index";
import { setCoinConfig, type CoinConfig } from "../config";
import type { EvmSigner } from "../types/signer";
import resolver from "../hw-getAddress";
import { setCryptoAssetsStoreGetter } from "../cryptoAssetsStore";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { getAccountShape, sync } from "./synchronization";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import { buildSignOperation } from "./signOperation";
import { hydrate, preload } from "./preload";
import { broadcast } from "./broadcast";

export function buildCurrencyBridge(signerContext: SignerContext<EvmSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload,
    hydrate,
    scanAccounts,
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
