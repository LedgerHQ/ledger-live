import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import {
  encodeAccountId,
  encodeTokenAccountId,
  emptyHistoryCache,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  makeSync,
  mergeOps,
  type GetAccountShape,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { type Operation } from "@ledgerhq/types-live";
import type { SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { BLOCK_HEIGHT } from "../constants";
import { getAccountBalances, getOperations, getDelegatedStakes } from "../network";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import { SuiOperationExtra, SuiAccount } from "../types";

export const getAccountShape: GetAccountShape<SuiAccount> = async (info, syncConfig) => {
  const { address, initialAccount, currency, derivationMode } = info;

  const oldOperations = initialAccount?.operations || [];
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const stakes = await getDelegatedStakes(address, currency.id);

  let syncHash = initialAccount?.syncHash ?? latestHash(oldOperations);
  const newOperations = await getOperations(accountId, address, syncHash, undefined, currency.id);
  const operations = mergeOps(oldOperations, newOperations);
  syncHash = latestHash(operations);

  const mainAccountOperations = operations.filter(
    ({ extra }) => (extra as SuiOperationExtra).coinType === DEFAULT_COIN_TYPE,
  );

  const accountBalances = await getAccountBalances(address, currency.id);
  const balance =
    accountBalances.find(({ coinType }) => coinType === DEFAULT_COIN_TYPE)?.balance ?? BigNumber(0);

  // `buildSubAccounts` batches `findTokenByAddressInCurrency` lookups internally
  // (concurrency 3); pre-filtering here would only serialise the same work.
  const subAccounts =
    (await buildSubAccounts({
      accountId,
      operations,
      subAccountsBalances: accountBalances,
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
    blockHeight: BLOCK_HEIGHT,
    subAccounts,
    suiResources: {
      stakes,
    },
    operations: mainAccountOperations,
  };
};

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
  const existingAccountByTicker: { [ticker: string]: TokenAccount } = {};
  const existingAccountTickers: string[] = [];

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
    blockHeight: BLOCK_HEIGHT,
    pendingOperations: initialTokenAccount?.pendingOperations || [],
    balanceHistoryCache: initialTokenAccount?.balanceHistoryCache || emptyHistoryCache,
    swapHistory: [],
  };
}

function latestHash(operations: Operation[]) {
  const confirmedOp = operations.find(op => op.blockHash !== null);
  return confirmedOp ? confirmedOp.blockHash : null;
}
