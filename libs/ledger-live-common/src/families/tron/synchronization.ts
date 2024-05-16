import get from "lodash/get";
import compact from "lodash/compact";
import BigNumber from "bignumber.js";
import {
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/coin-framework/account/index";
import { SubAccount, TokenAccount } from "@ledgerhq/types-live";
import { GetAccountShape, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { findTokenByAddressInCurrency, findTokenById } from "@ledgerhq/cryptoassets/tokens";
import { TronAccount, TronOperation, TrongridExtraTxInfo } from "./types";
import { getOperationsPageSize } from "../../pagination";
import { isParentTx, txInfoToOperation } from "./utils";
import { encodeOperationId } from "../../operation";
import {
  fetchCurrentBlockHeight,
  fetchTronAccount,
  fetchTronAccountTxs,
  getTronResources,
} from "./api";

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
    const defaultTronResources = await getTronResources();

    return {
      id: accountId,
      blockHeight,
      balance: new BigNumber(0),
      tronResources: defaultTronResources,
    };
  }

  const acc = tronAcc[0];
  const spendableBalance = acc.balance ? new BigNumber(acc.balance) : new BigNumber(0);
  const cacheTransactionInfoById = initialAccount
    ? {
        ...(initialAccount.tronResources.cacheTransactionInfoById || {}),
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
  const balance = spendableBalance
    .plus(tronResources.frozen.bandwidth ? tronResources.frozen.bandwidth.amount : new BigNumber(0))
    .plus(tronResources.frozen.energy ? tronResources.frozen.energy.amount : new BigNumber(0))
    .plus(
      tronResources.delegatedFrozen.bandwidth
        ? tronResources.delegatedFrozen.bandwidth.amount
        : new BigNumber(0),
    )
    .plus(
      tronResources.delegatedFrozen.energy
        ? tronResources.delegatedFrozen.energy.amount
        : new BigNumber(0),
    )

    .plus(
      tronResources.unFrozen.energy
        ? tronResources.unFrozen.energy.reduce((accum, cur) => {
            return accum.plus(cur.amount);
          }, new BigNumber(0))
        : new BigNumber(0),
    )
    .plus(
      tronResources.unFrozen.bandwidth
        ? tronResources.unFrozen.bandwidth.reduce((accum, cur) => {
            return accum.plus(cur.amount);
          }, new BigNumber(0))
        : new BigNumber(0),
    )
    .plus(
      tronResources.legacyFrozen.bandwidth
        ? tronResources.legacyFrozen.bandwidth.amount
        : new BigNumber(0),
    )
    .plus(
      tronResources.legacyFrozen.energy
        ? tronResources.legacyFrozen.energy.amount
        : new BigNumber(0),
    );

  const parentTxs = txs.filter(isParentTx);
  const parentOperations: TronOperation[] = compact(
    parentTxs.map(tx => txInfoToOperation(accountId, address, tx)),
  );

  const trc10Tokens = get(acc, "assetV2", []).reduce((accumulator, { key, value }) => {
    const tokenInfo = findTokenById(`tron/trc10/${key}`);
    if (tokenInfo) {
      accumulator.push({
        key,
        type: "trc10",
        tokenId: tokenInfo.id,
        balance: value,
      });
    }
    return accumulator;
  }, []);

  const trc20Tokens = get(acc, "trc20", []).reduce((accumulator, trc20) => {
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
  }, []);

  const subAccounts: SubAccount[] = compact(
    trc10Tokens.concat(trc20Tokens).map(({ key, tokenId, balance }) => {
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
    subAccounts,
    tronResources,
    blockHeight,
  };
};

export const postSync = (initial: TronAccount, parent: TronAccount): TronAccount => {
  function evictRecentOpsIfPending(a) {
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

export const sync = makeSync({ getAccountShape, postSync });
