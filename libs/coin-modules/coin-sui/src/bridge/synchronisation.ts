import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
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
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { type Operation } from "@ledgerhq/types-live";
import type { SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import suiConfig from "../config";
import { BLOCK_HEIGHT } from "../constants";
import { getAccountBalances, getOperations, getDelegatedStakes } from "../network";
import { DEFAULT_COIN_TYPE, toStakeAmounts } from "../network/sdk";
import { SuiOperationExtra, SuiAccount } from "../types";
import { toLongStructTag, toShortStructTag } from "../utils";

export const getAccountShape: GetAccountShape<SuiAccount> = async (info, syncConfig) => {
  const { address, initialAccount, currency, derivationMode } = info;

  const oldOperations = (initialAccount?.operations || []).map(revalueStoredStakingOperation);
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const config = suiConfig.getCoinConfig(currency.id);
  const stakes = await getDelegatedStakes(config, address);

  // `syncHash` holds the resume digest of the newest stored operation, from which `getOperations`
  // reads forward. An account holding no operations at all has nothing to resume from — a first
  // sync, or a cleared cache, since `clearAccount` empties `operations` but keeps `syncHash`.
  // Resuming there would leave the account with only what arrived after the cursor.
  //
  // Token operations count: `getOperationCoinType` files a transaction under the token it moves and
  // this account keeps only native-SUI operations, so a token-only account has an empty `operations`
  // while its history lives in the subaccounts. Reading the parent list alone would drop the cursor
  // on every sync.
  const hasStoredHistory =
    oldOperations.length > 0 ||
    (initialAccount?.subAccounts ?? []).some(sub => sub.operations.length > 0);
  let syncHash = hasStoredHistory ? (initialAccount?.syncHash ?? latestHash(oldOperations)) : null;
  const newOperations = await getOperations(config, accountId, address, syncHash);
  const operations = mergeOps(oldOperations, newOperations);
  syncHash = latestHash(operations);

  const mainAccountOperations = operations.filter(
    ({ extra }) => (extra as SuiOperationExtra).coinType === DEFAULT_COIN_TYPE,
  );

  const accountBalances = await getAccountBalances(config, address);
  const suiBalance = accountBalances.find(({ coinType }) => coinType === DEFAULT_COIN_TYPE);
  const spendableBalance = suiBalance?.balance ?? BigNumber(0);
  // Staked SUI still belongs to the owner, so it counts in `balance` but never in
  // `spendableBalance`. Valued as in `getBalance`: principal plus accrued reward.
  const stakedBalance = (stakes ?? [])
    .flatMap(pool => pool.stakes)
    .reduce((sum, stake) => {
      const { deposited, rewarded } = toStakeAmounts(stake);
      return sum.plus((deposited + rewarded).toString());
    }, BigNumber(0));
  const balance = spendableBalance.plus(stakedBalance);
  // SIP-58 address-balance portion of the native SUI balance — kept so the bridge can validate
  // a spend against it (gas is withdrawn from it when real coins can't cover the budget).
  const fundsInAddressBalance = suiBalance?.fundsInAddressBalance ?? BigNumber(0);

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
    spendableBalance,
    operationsCount: mainAccountOperations.length,
    blockHeight: BLOCK_HEIGHT,
    subAccounts,
    suiResources: {
      stakes,
      fundsInAddressBalance,
    },
    operations: mainAccountOperations,
  };
};

export const sync = makeSync({ getAccountShape, shouldMergeOps: false });

/**
 * Stake operations stored by earlier versions carry the liquid SUI they moved as `value`. The
 * account balance now counts staked SUI, so such a value would distort the balance history. Sync
 * reads forward from its cursor and never refetches these operations, so they are rewritten in
 * place to the value `getStakingOperationValue` gives: the gas the account paid, minus the reward
 * for an unstake. The gas is zero or the fee (a net fee can be negative when the storage rebate
 * exceeds the costs). `extra.principalExcluded` marks a new or rewritten value, so the rewrite
 * applies once.
 */
export function revalueStoredStakingOperation(op: Operation): Operation {
  if (op.type !== "DELEGATE" && op.type !== "UNDELEGATE") return op;
  const extra = (op.extra ?? {}) as SuiOperationExtra;
  if (extra.principalExcluded) return op;
  return {
    ...op,
    value: legacyStakingOperationValue(op, extra.stakedAmount),
    extra: { ...extra, principalExcluded: "true" },
  };
}

/**
 * An old value is the negated first balance change of the transaction. When that change is the
 * account's own, the principal recovers the new value exactly, whoever paid the gas: a stake held
 * principal plus gas, an unstake gas minus principal and reward. When the sponsor's gas change came
 * first, the old value equals the fee and nothing is recoverable. That case, and a missing
 * principal, fall back to the fee.
 */
function legacyStakingOperationValue(op: Operation, stakedAmount: string | undefined): BigNumber {
  if (!stakedAmount || op.value.eq(op.fee)) return op.fee;
  if (op.type === "UNDELEGATE") return op.value.plus(stakedAmount);
  const gasShare = op.value.minus(stakedAmount);
  return gasShare.isZero() || gasShare.eq(op.fee) ? gasShare : op.fee;
}

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
    if (accountBalance.coinType === DEFAULT_COIN_TYPE) return;

    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      toLongStructTag(accountBalance.coinType),
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
  const shortCoinType = toShortStructTag(token.contractAddress);
  const newOperations = operations
    .filter(({ extra }) => (extra as SuiOperationExtra).coinType === shortCoinType)
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
