import BigNumber from "bignumber.js";
import {
  encodeAccountId,
  encodeTokenAccountId,
  emptyHistoryCache,
} from "@ledgerhq/coin-framework/account/index";
import {
  makeSync,
  mergeOps,
  type GetAccountShape,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { type Operation } from "@ledgerhq/types-live";
import { listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets/tokens";
import { getAccountBalances, getOperations, getStakesRaw } from "../network";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import { SuiOperationExtra, SuiAccount } from "../types";
import type { SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { promiseAllBatched } from "@ledgerhq/live-promise";

/**
 * Get the shape of the account including its operations and balance.
 * @function getAccountShape
 * @param {Object} info - The information needed to retrieve the account shape.
 * @param {string} info.address - The address of the account.
 * @param {SuiAccount} info.initialAccount - The initial account data.
 * @param {Object} info.currency - The currency information.
 * @param {string} info.derivationMode - The derivation mode for the account.
 * @returns {Promise<Object>} A promise that resolves to the account shape including balance and operations.
 */
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

  let operations: Operation[] = [];
  const stakes = await getStakesRaw(address);

  let syncHash = initialAccount?.syncHash ?? latestHash(oldOperations);
  const newOperations = await getOperations(accountId, address, syncHash);
  operations = mergeOps(oldOperations, newOperations);
  syncHash = latestHash(operations);

  const mainAccountOperations = operations.filter(
    ({ extra }) => (extra as SuiOperationExtra).coinType === DEFAULT_COIN_TYPE,
  );

  const accountBalances = await getAccountBalances(address);
  const tokensCurrencies = listTokensForCryptoCurrency(currency);
  const tokensCurrenciesMap = tokensCurrencies.reduce(
    (acc, token) => {
      acc[token.contractAddress] = token;
      return acc;
    },
    {} as Record<string, (typeof tokensCurrencies)[0]>,
  );
  const balance =
    accountBalances.find(({ coinType }) => coinType === DEFAULT_COIN_TYPE)?.balance ?? BigNumber(0);
  const subAccountsBalances = accountBalances.filter(
    ({ coinType }) => tokensCurrenciesMap[coinType],
  );

  const subAccounts =
    (await buildSubAccounts({
      accountId,
      initialAccount,
      operations,
      subAccountsBalances,
      syncConfig,
      tokensCurrenciesMap,
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
};

/**
 * Synchronise the account with the latest operations and balance.
 * @function sync
 * @param {Object} params - The parameters for synchronisation.
 * @returns {Promise<void>} A promise that resolves when synchronisation is complete.
 */
export const sync = makeSync({ getAccountShape, shouldMergeOps: false });

async function buildSubAccounts({
  accountId,
  initialAccount,
  operations,
  subAccountsBalances,
  syncConfig,
  tokensCurrenciesMap,
}: {
  accountId: string;
  initialAccount?: SuiAccount | null | undefined;
  operations: Operation[];
  subAccountsBalances: { coinType: string; blockHeight: number; balance: BigNumber }[];
  syncConfig: SyncConfig;
  tokensCurrenciesMap: Record<string, TokenCurrency>;
}) {
  if (Object.keys(tokensCurrenciesMap).length === 0) return undefined;
  const { blacklistedTokenIds = [] } = syncConfig;
  const tokenAccounts: TokenAccount[] = [];
  const existingAccountByTicker: { [ticker: string]: TokenAccount } = {}; // used for fast lookup
  const existingAccountTickers: string[] = []; // used to keep track of ordering

  if (initialAccount?.subAccounts) {
    for (const existingSubAccount of initialAccount.subAccounts) {
      if (existingSubAccount.type === "TokenAccount") {
        const { ticker, id } = existingSubAccount.token;
        if (!blacklistedTokenIds.includes(id)) {
          existingAccountTickers.push(ticker);
          existingAccountByTicker[ticker] = existingSubAccount;
        }
      }
    }
  }

  await promiseAllBatched(3, subAccountsBalances, async accountBalance => {
    const token = tokensCurrenciesMap[accountBalance.coinType];
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
  return operations.length ? operations[0].blockHash : null;
}
