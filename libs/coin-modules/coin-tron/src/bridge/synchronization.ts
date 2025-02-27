import {
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/coin-framework/account";
import { GetAccountShape, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { findTokenByAddressInCurrency, findTokenById } from "@ledgerhq/cryptoassets/index";
import { Account, SubAccount, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import compact from "lodash/compact";
import get from "lodash/get";
import { computeBalanceBridge } from "../logic";
import { getOperationsPageSize } from "../logic/pagination";
import { fetchCurrentBlockHeight, fetchTronAccount, fetchTronAccountTxs } from "../network";
import { TronAccount, TrongridExtraTxInfo, TronOperation } from "../types";
import { defaultTronResources, getTronResources, isParentTx, txInfoToOperation } from "./utils";

type TronToken = {
  key: string;
  type: "trc10" | "trc20";
  tokenId: string;
  balance: string;
};

// the balance does not update straightaway so we should ignore recent operations if they are in pending for a bit
const PREFER_PENDING_OPERATIONS_UNTIL_BLOCK_VALIDATION = 35;

export const getAccountShape: GetAccountShape<TronAccount> = async (
  { initialAccount, currency, address, derivationMode },
  syncConfig,
) => {
  const blockHeight = await fetchCurrentBlockHeight();
  const tronAcc = await fetchTronAccount(address);

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
  const cacheTransactionInfoById = initialAccount
    ? {
        ...(initialAccount?.tronResources?.cacheTransactionInfoById || {}),
      }
    : {};
  const operationsPageSize = Math.min(
    1000,
    getOperationsPageSize(initialAccount && initialAccount.id, syncConfig),
  );
  // FIXME: this is not optional especially that we might already have initialAccount
  // use minimalOperationsBuilderSync to reconciliate and KEEP REF
  const txs = await fetchTronAccountTxs(
    address,
    txs => txs.length < operationsPageSize,
    cacheTransactionInfoById,
  );

  const tronResources = await getTronResources(acc, txs, cacheTransactionInfoById);
  // const tronResources = await getTronResources(acc);
  const spendableBalance = acc.balance ? new BigNumber(acc.balance) : new BigNumber(0);
  const balance = await computeBalanceBridge(acc);

  const parentTxs = txs.filter(isParentTx);
  const parentOperations: TronOperation[] = compact(
    parentTxs.map(tx => txInfoToOperation(accountId, address, tx)),
  );

  const trc10Tokens = get(acc, "assetV2", []).reduce(
    (accumulator: TronToken[], { key, value }: { key: string; value: number }) => {
      const tokenInfo = findTokenById(`tron/trc10/${key}`);
      if (tokenInfo) {
        accumulator.push({
          key,
          type: "trc10",
          tokenId: tokenInfo.id,
          balance: value.toString(),
        });
      }
      return accumulator;
    },
    [],
  );

  const trc20Tokens = get(acc, "trc20", []).reduce(
    (accumulator: TronToken[], trc20: Record<string, string>) => {
      const [[contractAddress, balance]] = Object.entries(trc20);
      const tokenInfo = findTokenByAddressInCurrency(contractAddress, currency.id);
      if (tokenInfo) {
        accumulator.push({
          key: contractAddress,
          type: "trc20",
          tokenId: tokenInfo.id,
          balance,
        });
      }
      return accumulator;
    },
    [],
  );

  const { blacklistedTokenIds = [] } = syncConfig;

  const subAccounts: SubAccount[] = compact(
    trc10Tokens.concat(trc20Tokens).map(({ key, tokenId, balance }: TronToken) => {
      const { blacklistedTokenIds = [] } = syncConfig;
      const token = findTokenById(tokenId);
      if (!token || blacklistedTokenIds.includes(tokenId)) return;
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
      return sub;
    }),
  );

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
  };
};

const postSync = (initial: TronAccount, parent: TronAccount): TronAccount => {
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
    .map(subAccount => {
      if (existingIds.has(subAccount.id)) {
        return null;
      } else {
        // Set balance and spendableBalance to 0 has if they are not here it means balance is 0
        return {
          ...subAccount,
          balance: new BigNumber(0),
          spendableBalance: new BigNumber(0),
        };
      }
    })
    .filter((elt): elt is NonNullable<typeof elt> => elt !== null);

  return subAccounts1.concat(filteredSubAccounts2);
};

export const sync = makeSync({
  getAccountShape,
  postSync,
});
