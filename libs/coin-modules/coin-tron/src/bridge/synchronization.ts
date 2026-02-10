import {
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/coin-framework/account";
import { GetAccountShape, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import compact from "lodash/compact";
import get from "lodash/get";
import { computeBalanceBridge, lastBlock } from "../logic";
import { getAccount } from "../logic/getAccount";
import { getOperationsPageSize } from "../logic/pagination";
import { defaultFetchParams, fetchTronAccountTxs } from "../network";
import { AccountTronAPI } from "../network/types";
import { TronAccount, TrongridExtraTxInfo, TronOperation } from "../types";
import {
  defaultTronResources,
  getTronResources,
  isParentTx,
  txInfoToOperation,
  isAccountEmpty,
} from "./utils";

type TronToken = {
  key: string;
  type: "trc10" | "trc20";
  tokenId: string;
  balance: string;
};

// the balance does not update straightaway so we should ignore recent operations if they are in pending for a bit
const PREFER_PENDING_OPERATIONS_UNTIL_BLOCK_VALIDATION = 35;
const MAX_OPERATIONS_PAGE_SIZE = 1000;

async function getTrc10Tokens(acc: AccountTronAPI): Promise<TronToken[]> {
  const trc10Tokens: TronToken[] = [];
  for (const { key, value } of get(acc, "assetV2", []) as { key: string; value: number }[]) {
    const tokenInfo = await getCryptoAssetsStore().findTokenById(`tron/trc10/${key}`);
    if (tokenInfo) {
      trc10Tokens.push({
        key,
        type: "trc10",
        tokenId: tokenInfo.id,
        balance: value.toString(),
      });
    }
  }
  return trc10Tokens;
}

async function getTrc20Tokens(acc: AccountTronAPI, currencyId: string): Promise<TronToken[]> {
  const trc20Tokens: TronToken[] = [];
  for (const trc20 of get(acc, "trc20", []) as Record<string, string>[]) {
    const [[contractAddress, balance]] = Object.entries(trc20);
    const tokenInfo = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      contractAddress,
      currencyId,
    );
    if (tokenInfo) {
      trc20Tokens.push({
        key: contractAddress,
        type: "trc20",
        tokenId: tokenInfo.id,
        balance,
      });
    }
  }
  return trc20Tokens;
}

export const getAccountShape: GetAccountShape<TronAccount> = async (
  { initialAccount, currency, address, derivationMode },
  syncConfig,
) => {
  const { height: blockHeight } = await lastBlock();
  const tronAcc = await getAccount(address);

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode: derivationMode,
  });

  if (tronAcc.length === 0) {
    return {
      id: accountId,
      blockHeight,
      balance: new BigNumber(0),
      tronResources: defaultTronResources,
    };
  }

  const acc = tronAcc[0];
  const cacheTransactionInfoById = initialAccount?.tronResources?.cacheTransactionInfoById || {};
  const operationsPageSize = Math.min(
    MAX_OPERATIONS_PAGE_SIZE,
    getOperationsPageSize(initialAccount?.id, syncConfig),
  );
  // FIXME: this is not optional especially that we might already have initialAccount
  // use minimalOperationsBuilderSync to reconciliate and KEEP REF
  const txs = await fetchTronAccountTxs(
    address,
    txs => txs.length < operationsPageSize,
    cacheTransactionInfoById,
    defaultFetchParams,
  );

  const tronResources = await getTronResources(acc, txs, cacheTransactionInfoById);
  // const tronResources = await getTronResources(acc);
  const spendableBalance = acc.balance ? new BigNumber(acc.balance) : new BigNumber(0);
  const balance = computeBalanceBridge(acc);

  const parentTxs = txs.filter(isParentTx);
  const parentOperations: TronOperation[] = compact(
    parentTxs.map(tx => txInfoToOperation(accountId, address, tx)),
  );

  const trc10Tokens = await getTrc10Tokens(acc);
  const trc20Tokens = await getTrc20Tokens(acc, currency.id);

  const { blacklistedTokenIds = [] } = syncConfig;

  const subAccounts: TokenAccount[] = [];
  for (const { key, tokenId, balance } of trc10Tokens.concat(trc20Tokens)) {
    const token = await getCryptoAssetsStore().findTokenById(tokenId);
    if (!token || blacklistedTokenIds.includes(tokenId)) continue;
    const id = encodeTokenAccountId(accountId, token);
    const tokenTxs = txs.filter(tx => tx.tokenId === key);
    const operations = compact(tokenTxs.map(tx => txInfoToOperation(id, address, tx)));
    const maybeExistingSubAccount = initialAccount?.subAccounts?.find(a => a.id === id);
    const bnBalance = new BigNumber(balance);
    const sub: TokenAccount = {
      type: "TokenAccount",
      id,
      parentId: accountId,
      token,
      balance: bnBalance,
      spendableBalance: bnBalance,
      operationsCount: operations.length,
      operations,
      pendingOperations: maybeExistingSubAccount ? maybeExistingSubAccount.pendingOperations : [],
      creationDate: operations.length > 0 ? operations[operations.length - 1].date : new Date(),
      swapHistory: maybeExistingSubAccount ? maybeExistingSubAccount.swapHistory : [],
      balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
    };
    subAccounts.push(sub);
  }

  // Filter blacklisted tokens from the initial account's subAccounts
  // Could be use to filter out tokens that got their CAL id changed
  const filteredInitialSubAccounts = (initialAccount?.subAccounts || []).filter(
    subAccount => !blacklistedTokenIds.includes(subAccount.token.id),
  );

  // keep old account with emptyBalance and a history not returned by the BE fixes LIVE-12797
  const mergedSubAccounts = mergeSubAccounts(subAccounts, filteredInitialSubAccounts);

  // get 'OUT' token operations with fee
  const subOutOperationsWithFee: TronOperation[] = subAccounts
    .flatMap(s => s.operations)
    .filter(o => o.type === "OUT" && o.fee.isGreaterThan(0))
    .map(
      (o): TronOperation => ({
        ...o,
        accountId,
        value: o.fee,
        id: encodeOperationId(accountId, o.hash, "OUT"),
        extra: o.extra as TrongridExtraTxInfo,
      }),
    );
  // add them to the parent operations and sort by date desc

  /**
   * FIXME
   *
   * We have a problem here as we're just concatenating ops without ever really linking them.
   * It means no operation can be "FEES" of a subOp by example. It leads to our issues with TRC10/TRC20
   * optimistic operation never really existing in the end.
   */
  const parentOpsAndSubOutOpsWithFee = parentOperations
    .concat(subOutOperationsWithFee)
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  return {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: parentOpsAndSubOutOpsWithFee.length,
    operations: parentOpsAndSubOutOpsWithFee,
    subAccounts: mergedSubAccounts,
    tronResources,
    blockHeight,
    used: !isAccountEmpty({ tronResources }),
  };
};

export const postSync = (_initial: TronAccount, parent: TronAccount): TronAccount => {
  function evictRecentOpsIfPending(a: Account | TokenAccount) {
    a.pendingOperations.forEach(pending => {
      const i = a.operations.findIndex(o => o.id === pending.id);

      if (i !== -1) {
        const diff = parent.blockHeight - (a.operations[i].blockHeight || 0);

        if (diff < PREFER_PENDING_OPERATIONS_UNTIL_BLOCK_VALIDATION) {
          a.operations.splice(i, 1);
        }
      }
    });
  }

  evictRecentOpsIfPending(parent);
  parent.subAccounts && parent.subAccounts.forEach(evictRecentOpsIfPending);
  return parent;
};

/**
 * Merges two arrays of subAccounts according to specific rules:
 * - The first array (subAccounts1) is up-to-date and should not be modified.
 * - Old duplicates from the second array (subAccounts2) should be filtered out.
 * - Only new subAccounts with a unique ID from the second array should be included.
 * - The balance and spendableBalance fields of the second array's subAccounts should be set to 0.
 *
 * @param {Array} subAccounts1 - The first array of subAccounts, which is up-to-date and should not be modified.
 * @param {Array} subAccounts2 - The second array of subAccounts, from which only new unique subAccounts should be included.
 * @returns {Array} - The merged array of subAccounts.
 */
const mergeSubAccounts = (subAccounts1: TokenAccount[], subAccounts2: TokenAccount[]) => {
  const existingIds = new Set(subAccounts1.map(subAccount => subAccount.id));
  const filteredSubAccounts2: TokenAccount[] = subAccounts2
    .filter(subAccount => !existingIds.has(subAccount.id))
    .map(subAccount => ({
      ...subAccount,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
    }));

  return subAccounts1.concat(filteredSubAccounts2);
};

export const sync = makeSync({
  getAccountShape,
  postSync,
});
