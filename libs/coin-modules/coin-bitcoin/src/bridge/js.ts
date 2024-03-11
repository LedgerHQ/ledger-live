import { Account, BroadcastArg } from "@ledgerhq/types-live";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { Transaction } from "../types";
import { StartSpan, makeGetAccountShape, postSync } from "../js-synchronisation";
import createTransaction from "../js-createTransaction";
import prepareTransaction from "../js-prepareTransaction";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import buildSignOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import { calculateFees } from "./../cache";
import { perCoinLogic } from "../logic";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import resolver from "../hw-getAddress";
import { SignerContext } from "../signer";

function buildCurrencyBridge(signerContext: SignerContext, perfLogger: PerfLogger) {
  const getAddress = resolver(signerContext);
  const scanAccounts = makeScanAccounts({
    getAccountShape: makeGetAccountShape(signerContext, perfLogger.startSpan),
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    scanAccounts,
    preload: () => Promise.resolve({}),
    hydrate: () => {},
  };
}

function buildAccountBridge(signerContext: SignerContext, perfLogger: PerfLogger) {
  const sync = makeSync({
    getAccountShape: makeGetAccountShape(signerContext, perfLogger.startSpan),
    postSync,
  });

  const getAddress = resolver(signerContext);
  const injectGetAddressParams = (account: Account): any => {
    const perCoin = perCoinLogic[account.currency.id];

    if (perCoin && perCoin.injectGetAddressParams) {
      return perCoin.injectGetAddressParams(account);
    }
  };
  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress), {
    injectGetAddressParams,
  });

  const updateTransaction = (tx: Transaction, patch: Partial<Transaction>): any => {
    const updatedT = defaultUpdateTransaction(tx, patch);

    // We accept case-insensitive addresses as input from user,
    // but segwit addresses need to be converted to lowercase to be valid
    if (updatedT.recipient.toLowerCase().indexOf("bc1") === 0) {
      updatedT.recipient = updatedT.recipient.toLowerCase();
    }

    return updatedT;
  };

  return {
    estimateMaxSpendable,
    createTransaction,
    prepareTransaction,
    updateTransaction,
    getTransactionStatus,
    receive,
    sync,
    signOperation: buildSignOperation(signerContext),
    broadcast: async ({ account, signedOperation }: BroadcastArg) => {
      calculateFees.reset();
      return broadcast({
        account,
        signedOperation,
      });
    },
    assignFromAccountRaw,
    assignToAccountRaw,
  };
}

export type PerfLogger = {
  startSpan: StartSpan;
};
export function createBridges(signerContext: SignerContext, perfLogger: PerfLogger) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext, perfLogger),
    accountBridge: buildAccountBridge(signerContext, perfLogger),
  };
}
