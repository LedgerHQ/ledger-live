import { encodeAccountId, getSyncHash } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation, cleanedOperation, extractBalance } from "./utils";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization";
import { buildSubAccounts, mergeSubAccounts } from "./buildSubAccounts";
import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/types";
import type { OperationCommon } from "./types";
import type { Account } from "@ledgerhq/types-live";

function isNftCoreOp(operation: Operation): boolean {
  return (
    typeof operation.details?.ledgerOpType === "string" &&
    ["NFT_IN", "NFT_OUT"].includes(operation.details?.ledgerOpType)
  );
}

export function genericGetAccountShape(network: string, kind: string): GetAccountShape {
  return async (info, syncConfig) => {
    const { address, initialAccount, currency, derivationMode } = info;
    const alpacaApi = getAlpacaApi(currency.id, kind);

    if (alpacaApi.getChainSpecificRules) {
      const chainSpecificValidation = alpacaApi.getChainSpecificRules();
      if (chainSpecificValidation.getAccountShape) {
        chainSpecificValidation.getAccountShape(address);
      }
    }

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: address,
      derivationMode,
    });

    const blockInfo = await alpacaApi.lastBlock();
    const balanceRes = await alpacaApi.getBalance(address);
    const nativeAsset = extractBalance(balanceRes, "native");

    const allTokenAssetsBalances = balanceRes.filter(b => b.asset.type !== "native");
    const nativeBalance = BigInt(nativeAsset?.value ?? "0");

    const spendableBalance = BigInt(nativeBalance - BigInt(nativeAsset?.locked ?? "0"));

    // Normalize pre-alpaca operations to the new accountId to keep UI rendering consistent
    const oldOps = ((initialAccount?.operations || []) as OperationCommon[]).map(op =>
      op.accountId === accountId
        ? op
        : { ...op, accountId, id: encodeOperationId(accountId, op.hash, op.type) },
    );
    const lastPagingToken = oldOps[0]?.extra?.pagingToken || "";
    const syncHash = await getSyncHash(currency.id, syncConfig.blacklistedTokenIds);
    const syncFromScratch = !initialAccount?.blockHeight || initialAccount?.syncHash !== syncHash;

    // Calculate minHeight for pagination
    const minHeight = syncFromScratch ? 0 : (oldOps[0]?.blockHeight ?? 0) + 1;
    const paginationParams: Pagination = { minHeight, order: "asc" };
    if (lastPagingToken && !syncFromScratch) {
      paginationParams.lastPagingToken = lastPagingToken;
    }

    const [newCoreOps] = await alpacaApi.listOperations(address, paginationParams);
    const newOps = newCoreOps
      .filter(op => !isNftCoreOp(op))
      .map(op => adaptCoreOperationToLiveOperation(accountId, op)) as OperationCommon[];

    const newAssetOperations = newOps.filter(
      operation =>
        operation?.extra?.assetReference &&
        operation?.extra?.assetOwner &&
        !["OPT_IN", "OPT_OUT"].includes(operation.type),
    );
    const newSubAccounts = await buildSubAccounts({
      accountId,
      allTokenAssetsBalances,
      syncConfig,
      operations: newAssetOperations,
      getTokenFromAsset: alpacaApi.getTokenFromAsset,
    });
    const subAccounts = syncFromScratch
      ? newSubAccounts
      : mergeSubAccounts(initialAccount?.subAccounts ?? [], newSubAccounts);

    const newOpsWithSubs = newOps.map(op => {
      const subOperations = inferSubOperations(op.hash, newSubAccounts);

      return cleanedOperation({
        ...op,
        subOperations,
      });
    });
    const confirmedOperations =
      alpacaApi.refreshOperations && initialAccount?.pendingOperations.length
        ? await alpacaApi.refreshOperations(initialAccount.pendingOperations)
        : [];
    const newOperations = [...confirmedOperations, ...newOpsWithSubs];
    const operations = syncFromScratch
      ? newOperations
      : (mergeOps(oldOps, newOperations) as OperationCommon[]);

    const res: Partial<Account> = {
      id: accountId,
      xpub: address,
      blockHeight: operations.length === 0 ? 0 : blockInfo.height || initialAccount?.blockHeight,
      balance: new BigNumber(nativeBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      operations,
      subAccounts,
      operationsCount: operations.length,
      syncHash,
    };
    return res;
  };
}
