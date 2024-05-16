import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  makeAccountBridgeReceive,
  defaultUpdateTransaction,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { NearAccount, Transaction, TransactionStatus } from "../types";
import resolver from "../hw-getAddress";
import { sync, getAccountShape } from "../synchronisation";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import getTransactionStatus from "../getTransactionStatus";
import { buildSignOperation } from "../signOperation";
import { broadcast } from "../broadcast";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { preload, hydrate, getPreloadStrategy } from "../preload";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import { NearSigner } from "../signer";
import { NearCoinConfig, setCoinConfig } from "../config";

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
): AccountBridge<Transaction, TransactionStatus, NearAccount> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction: defaultUpdateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    broadcast,
    assignToAccountRaw,
    assignFromAccountRaw,
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
