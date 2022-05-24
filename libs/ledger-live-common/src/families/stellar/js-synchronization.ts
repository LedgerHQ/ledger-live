import { BigNumber } from "bignumber.js";
import type { Operation, TokenAccount } from "../../types";
import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeScanAccounts, makeSync, mergeOps } from "../../bridge/jsHelpers";
import { fetchAccount, fetchOperations } from "./api";
import { buildSubAccounts } from "./tokens";

const getOldAssetOperations = (
  subAccounts?: TokenAccount[]
):
  | {
      [tokenId: string]: Operation[];
    }
  | undefined => {
  return subAccounts?.reduce((result, tokenAccount) => {
    if (result[tokenAccount.id]) {
      result[tokenAccount.id] = [
        ...result[tokenAccount.id],
        ...(tokenAccount.operations || []),
      ];
    } else {
      result[tokenAccount.id] = tokenAccount.operations || [];
    }

    return result;
  }, {});
};

const getAccountShape: GetAccountShape = async (info, syncConfig) => {
  const { address, currency, initialAccount, derivationMode } = info;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const { blockHeight, balance, spendableBalance, assets } = await fetchAccount(
    address
  );

  const oldNativeOps = initialAccount?.operations || [];
  // Creating a map of asset operations
  const oldAssetOps =
    getOldAssetOperations(initialAccount?.subAccounts as TokenAccount[]) || [];
  const oldOperations = [
    ...oldNativeOps,
    ...Object.values(oldAssetOps).reduce(
      (result, ops) => [...result, ...ops],
      []
    ),
  ];

  const oldNativeOpsLastPagingToken = oldNativeOps[0]?.extra?.pagingToken || 0;
  // Find the last cursor/paging token for every asset's last op
  const oldAssetOpsLastPagingTokens = Object.values(oldAssetOps).reduce(
    (result: string[], ops) => [...result, ops[0]?.extra?.pagingToken || 0],
    []
  );
  // Find the last paging token from all
  const lastPagingToken = BigNumber.max(
    oldNativeOpsLastPagingToken,
    ...oldAssetOpsLastPagingTokens,
    0
  ).toString();

  const newOperations =
    (await fetchOperations({
      accountId,
      addr: address,
      order: "asc",
      cursor: lastPagingToken,
    })) || [];

  const allOperations = mergeOps(oldOperations, newOperations);

  const nativeOperations: Operation[] = [];
  const assetOperations: Operation[] = [];

  allOperations.forEach((op) => {
    // change_trust operations
    if (op.type === "OPT_IN" || op.type === "OPT_OUT") {
      nativeOperations.push(op);
    } else if (op?.extra?.assetCode && op?.extra?.assetIssuer) {
      assetOperations.push(op);
    } else {
      nativeOperations.push(op);
    }
  });

  const subAccounts =
    buildSubAccounts({
      currency,
      accountId,
      assets,
      syncConfig,
      operations: assetOperations,
    }) || [];

  const shape = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: nativeOperations.length,
    blockHeight,
    subAccounts,
  };
  return { ...shape, operations: nativeOperations };
};

export const sync = makeSync({ getAccountShape });
export const scanAccounts = makeScanAccounts({ getAccountShape });
