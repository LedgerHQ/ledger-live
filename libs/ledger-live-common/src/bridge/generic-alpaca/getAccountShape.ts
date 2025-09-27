import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation, extractBalance } from "./utils";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization";
import { buildSubAccounts, OperationCommon } from "./buildSubAccounts";
import { Pagination } from "@ledgerhq/coin-framework/api/types";

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

    // Calculate minHeight for pagination
    let minHeight: number = 0;
    if (oldOps.length > 0 && initialAccount?.blockHeight !== 0) {
      minHeight = (oldOps[0].blockHeight ?? 0) + 1;
    }
    const paginationParams: Pagination = { minHeight, order: "asc" };
    if (lastPagingToken) {
      paginationParams.lastPagingToken = lastPagingToken;
    }

    const [newCoreOps] = await alpacaApi.listOperations(address, paginationParams);
    const newOps = newCoreOps.map(op =>
      adaptCoreOperationToLiveOperation(accountId, op),
    ) as OperationCommon[];
    const mergedOps = mergeOps(oldOps, newOps) as OperationCommon[];

    const assetOperations: OperationCommon[] = [];
    mergedOps.forEach(operation => {
      if (
        operation?.extra?.assetReference &&
        operation?.extra?.assetOwner &&
        !["OPT_IN", "OPT_OUT"].includes(operation.type)
      ) {
        assetOperations.push(operation);
      }
    });

    const subAccounts = await buildSubAccounts({
      currency,
      accountId,
      allTokenAssetsBalances,
      syncConfig,
      operations: assetOperations,
      getTokenFromAsset: alpacaApi.getTokenFromAsset,
    });

    const operations = mergedOps.map(op => {
      const subOperations = inferSubOperations(op.hash, subAccounts);

      return {
        ...op,
        subOperations,
      };
    });

    const res = {
      id: accountId,
      xpub: address,
      blockHeight: operations.length === 0 ? 0 : blockInfo.height || initialAccount?.blockHeight,
      balance: new BigNumber(nativeBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      operations,
      subAccounts,
      operationsCount: operations.length,
    };
    return res;
  };
}
