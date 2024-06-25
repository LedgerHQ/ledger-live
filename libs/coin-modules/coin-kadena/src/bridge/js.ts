import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAccountShape } from "../js-synchronisation";
import { buildSignOperation } from "../js-signOperation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { createTransaction, prepareTransaction } from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import broadcast from "../js-broadcast";
import resolver from "../hw-getAddress";

import { KadenaAddress, KadenaSignature, KadenaSigner } from "../signer";

export function buildCurrencyBridge(
  signerContext: SignerContext<KadenaSigner>,
): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload: () => Promise.resolve({}),
    hydrate: () => Promise.resolve({}),
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<KadenaSigner>,
): AccountBridge<Transaction> {
  const getAddress = resolver(signerContext);
  const sync = makeSync({ getAccountShape });

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
  };
}

export function createBridges(
  signerContext: SignerContext<KadenaSigner>,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
