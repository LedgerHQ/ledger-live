import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  updateTransaction,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { NearAccount, Transaction, TransactionStatus } from "../types";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import { preload, hydrate, getPreloadStrategy } from "../preload";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { sync, getAccountShape } from "../synchronisation";
import { prepareTransaction } from "../prepareTransaction";
import { NearCoinConfig, setCoinConfig } from "../config";
import { createTransaction } from "../createTransaction";
import { buildSignOperation } from "../signOperation";
import { broadcast } from "../broadcast";
import resolver from "../hw-getAddress";
import { NearSigner } from "../signer";

export function buildCurrencyBridge(signerContext: SignerContext<NearSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload,
    hydrate,
    getPreloadStrategy,
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<NearSigner>,
): AccountBridge<Transaction, NearAccount, TransactionStatus> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    broadcast,
    assignToAccountRaw,
    assignFromAccountRaw,
    getSerializedAddressParameters,
  };
}

export function createBridges(
  signerContext: SignerContext<NearSigner>,
  coinConfig: NearCoinConfig,
) {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
