/* istanbul ignore file: pure exports, bridge tested by live-common with bridge.integration.test.ts */
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, AccountBridge, Bridge, CurrencyBridge } from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type {
  Transaction as EvmTransaction,
  TransactionRaw as EvmTransactionRaw,
  TransactionStatus,
  TransactionStatusRaw,
} from "../types/index";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import { getAccountShape, sync } from "../synchronization";
import { setCoinConfig, type CoinConfig } from "../config";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { buildSignOperation } from "../signOperation";
import { serialization } from "../transaction";
import type { EvmSigner } from "../types/signer";
import { hydrate, preload } from "../preload";
import nftResolvers from "../nftResolvers";
import { broadcast } from "../broadcast";
import resolver from "../hw-getAddress";

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
    nftResolvers,
    getPreloadStrategy: () => ({
      preloadMaxAge: 24 * 60 * 60 * 1000, // 1 day cache
    }),
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<EvmSigner>,
): AccountBridge<
  EvmTransaction,
  Account,
  TransactionStatus,
  EvmTransactionRaw,
  TransactionStatusRaw
> {
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
    ...serialization,
  };
}

export function createBridges(
  signerContext: SignerContext<EvmSigner>,
  coinConfig: CoinConfig,
): Bridge<EvmTransaction, Account, TransactionStatus, EvmTransactionRaw, TransactionStatusRaw> {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
