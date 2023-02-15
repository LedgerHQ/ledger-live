// @flow
/* eslint-disable flowtype/generic-spacing */

import { BigNumber } from "bignumber.js";
import { map, tap } from "rxjs/operators";
import type { Account, AccountLike, CurrencyBridge, AccountBridge } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import isEqual from "lodash/isEqual";
import {
  fromTransactionRaw,
  toTransactionRaw,
  toSignedOperationRaw,
  fromTransactionStatusRaw,
  fromSignOperationEventRaw,
} from "@ledgerhq/live-common/transaction/index";
import {
  toAccountLikeRaw,
  toAccountRaw,
  fromOperationRaw,
} from "@ledgerhq/live-common/account/index";
import { startSpan } from "@ledgerhq/live-common/performance";
import { patchAccount } from "@ledgerhq/live-common/reconciliation";
import { fromScanAccountEventRaw } from "@ledgerhq/live-common/bridge/index";
import * as bridgeImpl from "@ledgerhq/live-common/bridge/impl";
import { command } from "~/renderer/commands";
import { getEnv } from "@ledgerhq/live-common/env";

const scanAccounts = ({ currency, deviceId, syncConfig }) =>
  command("CurrencyScanAccounts")({
    currencyId: currency.id,
    deviceId,
    syncConfig,
  }).pipe(map(fromScanAccountEventRaw));

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  const bridge = bridgeImpl.getCurrencyBridge(currency);
  if (getEnv("EXPERIMENTAL_EXECUTION_ON_RENDERER")) return bridge;
  const bridgeGetPreloadStrategy = bridge.getPreloadStrategy;
  const getPreloadStrategy = bridgeGetPreloadStrategy
    ? currency => bridgeGetPreloadStrategy.call(bridge, currency)
    : undefined;
  const b: CurrencyBridge = {
    preload: async () => {
      const value = await command("CurrencyPreload")({ currencyId: currency.id }).toPromise();
      bridge.hydrate(value, currency);
      return value;
    },

    hydrate: value => bridge.hydrate(value, currency),

    scanAccounts,
    nftResolvers: bridge.nftResolvers,
  };

  if (getPreloadStrategy) {
    b.getPreloadStrategy = getPreloadStrategy;
  }

  return b;
};

const syncs = {};
export const hasOngoingSync = (accountId: string): boolean => Boolean(syncs[accountId]);

export const getAccountBridge = (
  account: AccountLike,
  parentAccount: ?Account,
): AccountBridge<any> => {
  if (getEnv("EXPERIMENTAL_EXECUTION_ON_RENDERER")) {
    return bridgeImpl.getAccountBridge(account, parentAccount);
  }

  const sync = (account, syncConfig) => {
    syncs[account.id] = true;
    const span = startSpan("sync", "toAccountRaw");
    const raw = toAccountRaw(account);
    span.finish();
    return command("AccountSync")({
      account: raw,
      syncConfig,
    }).pipe(
      map(raw => account => {
        const span = startSpan("sync", "patchAccount");
        const r = patchAccount(account, raw);
        span.finish();
        return r;
      }),
      tap(() => {
        // on first next event, we set it off
        syncs[account.id] = false;
      }),
    );
  };
  const bridge = bridgeImpl.getAccountBridge(account, parentAccount);
  const receive = (account, arg) =>
    command("AccountReceive")({
      account: toAccountRaw(account),
      arg,
    });

  const createTransaction = account => bridge.createTransaction(account);

  const updateTransaction = (account, patch) => bridge.updateTransaction(account, patch);

  const prepareTransaction = async (a, t) => {
    const transaction = toTransactionRaw(t);
    const result = await command("AccountPrepareTransaction")({
      account: toAccountRaw(a),
      transaction,
    }).toPromise();

    // this will remove the `undefined` fields due to JSON back&forth
    const sentTransaction = JSON.parse(JSON.stringify(transaction));
    if (isEqual(sentTransaction, result)) {
      return t; // preserve reference by deep equality of the TransactionRaw
    }
    return fromTransactionRaw(result);
  };

  const getTransactionStatus = (a, t) =>
    command("AccountGetTransactionStatus")({
      account: toAccountRaw(a),
      transaction: toTransactionRaw(t),
    })
      .toPromise()
      .then(transactionStatus => fromTransactionStatusRaw(transactionStatus, a.currency.family));

  const signOperation = ({ account, transaction, deviceId }) =>
    command("AccountSignOperation")({
      account: toAccountRaw(account),
      transaction: toTransactionRaw(transaction),
      deviceId,
    }).pipe(map(raw => fromSignOperationEventRaw(raw, account.id)));

  const broadcast = ({ account, signedOperation }) =>
    command("AccountBroadcast")({
      account: toAccountRaw(account),
      signedOperation: toSignedOperationRaw(signedOperation, true),
    })
      .pipe(map(raw => fromOperationRaw(raw, account.id)))
      .toPromise();

  const estimateMaxSpendable = ({ account, parentAccount, transaction }) =>
    command("AccountEstimateMaxSpendable")({
      account: toAccountLikeRaw(account),
      parentAccount: parentAccount ? toAccountRaw(parentAccount) : null,
      transaction: transaction ? toTransactionRaw(transaction) : null,
    })
      .pipe(map(raw => BigNumber(raw)))
      .toPromise();

  return {
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    applyReconciliation: bridge.applyReconciliation,
    assignToAccountRaw: bridge.assignToAccountRaw,
    assignFromAccountRaw: bridge.assignFromAccountRaw,
    initAccount: bridge.initAccount,
    signOperation,
    broadcast,
    estimateMaxSpendable,
  };
};
