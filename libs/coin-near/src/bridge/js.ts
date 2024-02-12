import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  makeAccountBridgeReceive,
  defaultUpdateTransaction,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { Transaction } from "../types";
import resolver from "../hw-getAddress";
import { sync, getAccountShape } from "../js-synchronisation";
import { createTransaction, prepareTransaction } from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import { buildSignOperation } from "../js-signOperation";
import broadcast from "../js-broadcast";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import { preload, hydrate, getPreloadStrategy } from "../preload";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import { NearAddress, NearSignature, NearSigner } from "../signer";

export function buildCurrencyBridge(
  signerContext: SignerContext<NearSigner, NearAddress | NearSignature>,
): CurrencyBridge {
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
  signerContext: SignerContext<NearSigner, NearAddress | NearSignature>,
): AccountBridge<Transaction> {
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
  signerContext: SignerContext<NearSigner, NearAddress | NearSignature>,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
