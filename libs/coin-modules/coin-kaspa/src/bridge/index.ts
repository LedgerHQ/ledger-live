import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";

import type { KaspaAccount, Transaction, TransactionStatus } from "../types";
import { KaspaSigner } from "../types";

import { estimateMaxSpendable } from "./estimateMaxSpendable";
import getTransactionStatus from "./getTransactionStatus";
import { makeGetAccountShape } from "./synchronization";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import { updateTransaction } from "./updateTransaction";
import { broadcast } from "./broadcast";
import { initAccount } from "./initAccount";
import resolver from "../hw-getAddress";
import { buildSignOperation } from "./signOperation";

export function buildCurrencyBridge(signerContext: SignerContext<KaspaSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape: makeGetAccountShape(signerContext),
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload: async () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<KaspaSigner>,
): AccountBridge<Transaction, KaspaAccount, TransactionStatus> {
  const getAddress = resolver(signerContext);

  const sync = makeSync({
    getAccountShape: makeGetAccountShape(signerContext),
  });

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    getSerializedAddressParameters,
    createTransaction,
    updateTransaction,
    prepareTransaction,
    getTransactionStatus,
    sync,
    receive,
    initAccount,
    signOperation,
    broadcast,
    estimateMaxSpendable,
  };
}

export function createBridges(signerContext: SignerContext<KaspaSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
