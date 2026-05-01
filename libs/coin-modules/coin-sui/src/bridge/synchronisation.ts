import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import {
  encodeAccountId,
  encodeTokenAccountId,
  emptyHistoryCache,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  makeSync,
  mergeOps,
  type GetAccountShapeStream,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { type Operation } from "@ledgerhq/types-live";
import type { SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { getAccountBalances, getOperations, getStakesRaw } from "../network";
import { AccountBalance, DEFAULT_COIN_TYPE } from "../network/sdk";
import { SuiOperationExtra, SuiAccount } from "../types";

/**
 * Stream-variant `getAccountShape`: wraps the sync body in an Observable so
 * that the framework's unsubscribe-on-supersede triggers `controller.abort()`,
 * which cascades into every in-flight Sui network call (fetcher, JSON-RPC and
 * GraphQL clients all forward `signal`). Final shape only — no progress events.
 */
export const getAccountShape: GetAccountShapeStream<SuiAccount> = (info, syncConfig) =>
  new Observable<Partial<SuiAccount>>(subscriber => {
    const controller = new AbortController();
    const { signal } = controller;
    (async () => {
      const { address, initialAccount, currency, derivationMode } = info;

      const oldOperations = initialAccount?.operations || [];
      const accountId = encodeAccountId({
        type: "js",
        version: "2",
        currencyId: currency.id,
        xpubOrAddress: address,
        derivationMode,
      });

      let operations: Operation[] = [];
      const stakes = await getStakesRaw(address, currency.id, signal);

      let syncHash = initialAccount?.syncHash ?? latestHash(oldOperations);
      const newOperations = await getOperations(
        accountId,
        address,
        syncHash,
        undefined,
        currency.id,
        signal,
      );
      operations = mergeOps(oldOperations, newOperations);
      syncHash = latestHash(operations);

      const mainAccountOperations = operations.filter(
        ({ extra }) => (extra as SuiOperationExtra).coinType === DEFAULT_COIN_TYPE,
      );

      const accountBalances = await getAccountBalances(address, currency.id, signal);
      const balance =
        accountBalances.find(({ coinType }) => coinType === DEFAULT_COIN_TYPE)?.balance ??
        BigNumber(0);

      const subAccountsBalances: AccountBalance[] = [];
      for (const accountBalance of accountBalances) {
        const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
          accountBalance.coinType,
          currency.id,
        );
        if (token) {
          subAccountsBalances.push(accountBalance);
        }
      }

      const subAccounts =
        (await buildSubAccounts({
          accountId,
          operations,
          subAccountsBalances,
          syncConfig,
          currencyId: currency.id,
          subAccounts: initialAccount?.subAccounts ?? [],
        })) || [];

      return {
        id: accountId,
        syncHash: syncHash ?? undefined,
        balance,
        spendableBalance: balance,
        operationsCount: mainAccountOperations.length,
        blockHeight: 5,
        subAccounts,
        suiResources: {
          stakes,
        },
        operations: mainAccountOperations,
      };
    })().then(
      shape => {
        if (signal.aborted) return; // already torn down — don't emit stale data
        subscriber.next(shape);
        subscriber.complete();
      },
      err => {
        // Abort during await rejects with a signal-derived error; treat that as
        // a clean teardown rather than propagating it to the framework.
        if (signal.aborted) subscriber.complete();
        else subscriber.error(err);
      },
    );
    return () => controller.abort();
  });

/**
 * Synchronise the account with the latest operations and balance.
 * @function sync
 * @param {Object} params - The parameters for synchronisation.
 * @returns {Promise<void>} A promise that resolves when synchronisation is complete.
 */
export const sync = makeSync({ getAccountShape, shouldMergeOps: false });

async function buildSubAccounts({
  accountId,
  operations,
  subAccountsBalances,
  syncConfig,
  currencyId,
  subAccounts,
}: {
  accountId: string;
  operations: Operation[];
  subAccountsBalances: { coinType: string; blockHeight: number; balance: BigNumber }[];
  syncConfig: SyncConfig;
  currencyId: string;
  subAccounts: TokenAccount[];
}) {
  if (subAccountsBalances.length === 0) return undefined;
  const { blacklistedTokenIds = [] } = syncConfig;
  const tokenAccounts: TokenAccount[] = [];
  const existingAccountByTicker: { [ticker: string]: TokenAccount } = {}; // used for fast lookup
  const existingAccountTickers: string[] = []; // used to keep track of ordering

  for (const existingSubAccount of subAccounts) {
    if (existingSubAccount.type === "TokenAccount") {
      const { ticker, id } = existingSubAccount.token;
      if (!blacklistedTokenIds.includes(id)) {
        existingAccountTickers.push(ticker);
        existingAccountByTicker[ticker] = existingSubAccount;
      }
    }
  }

  await promiseAllBatched(3, subAccountsBalances, async accountBalance => {
    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      accountBalance.coinType,
      currencyId,
    );

    if (token && !blacklistedTokenIds.includes(token.id)) {
      const initialTokenAccount = existingAccountByTicker[token.ticker];
      const tokenAccount = await buildSubAccount({
        accountBalance: accountBalance.balance,
        accountId,
        initialTokenAccount,
        operations,
        parentAccountId: accountId,
        token,
      });
      if (tokenAccount) tokenAccounts.push(tokenAccount);
    }
  });

  // Preserve order of tokenAccounts from the existing token accounts
  tokenAccounts.sort((a, b) => {
    const i = existingAccountTickers.indexOf(a.token.ticker);
    const j = existingAccountTickers.indexOf(b.token.ticker);
    if (i === j) return 0;
    if (i < 0) return 1;
    if (j < 0) return -1;
    return i - j;
  });
  return tokenAccounts;
}

function buildSubAccount({
  accountBalance,
  accountId,
  initialTokenAccount,
  operations,
  parentAccountId,
  token,
}: {
  accountBalance: BigNumber;
  accountId: string;
  initialTokenAccount: TokenAccount;
  operations: Operation[];
  parentAccountId: string;
  token: TokenCurrency;
}) {
  const subAccountId = encodeTokenAccountId(accountId, token);
  const oldOperations = initialTokenAccount?.operations || [];
  const newOperations = operations
    .filter(({ extra }) => (extra as SuiOperationExtra).coinType === token.contractAddress)
    .map(op => ({
      ...op,
      accountId: subAccountId,
    }));
  const tokenOperations = mergeOps(oldOperations, newOperations);

  return {
    type: "TokenAccount" as const,
    id: subAccountId,
    parentId: parentAccountId,
    token,
    balance: accountBalance,
    spendableBalance: accountBalance,
    operationsCount: tokenOperations.length,
    operations: tokenOperations,
    creationDate:
      tokenOperations.length > 0 ? tokenOperations[tokenOperations.length - 1].date : new Date(),
    blockHeight: 5,
    pendingOperations: initialTokenAccount?.pendingOperations || [],
    balanceHistoryCache: initialTokenAccount?.balanceHistoryCache || emptyHistoryCache,
    swapHistory: [],
  };
}

function latestHash(operations: Operation[]) {
  const confirmedOp = operations.find(op => op.blockHash !== null);
  return confirmedOp ? confirmedOp.blockHash : null;
}
