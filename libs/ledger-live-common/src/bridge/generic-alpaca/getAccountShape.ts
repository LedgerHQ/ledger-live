import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation, extractBalance } from "./utils";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization";
import { findToken } from "./buildSubAccounts";
import { buildSubAccounts, OperationCommon } from "./buildSubAccounts";

export function genericGetAccountShape(network: string, kind: string): GetAccountShape {
  return async (info, syncConfig) => {
    const { address, initialAccount, currency, derivationMode } = info;
    const alpacaApi = getAlpacaApi(network, kind);

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

    const assetsBalance = balanceRes
      .filter(b => b.asset.type !== "native")
      .filter(b => findToken(currency, b));

    const nativeBalance = BigInt(nativeAsset?.value ?? "0");

    const spendableBalance = BigInt(nativeBalance - BigInt(nativeAsset?.locked ?? "0"));

    const oldOps = (initialAccount?.operations || []) as OperationCommon[];
    const lastPagingToken = oldOps[0]?.extra?.pagingToken || "";

    const blockHeight = oldOps.length ? (oldOps[0].blockHeight ?? 0) + 1 : 0;
    const paginationParams: any = { minHeight: blockHeight, order: "asc" };
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

    const subAccounts =
      buildSubAccounts({
        currency,
        accountId,
        assetsBalance,
        syncConfig,
        operations: assetOperations,
      }) || [];

    const operationsWithSubs = mergedOps.map(op => {
      const subOperations = inferSubOperations(op.hash, subAccounts);

      return {
        ...op,
        subOperations,
      };
    });

    const res = {
      id: accountId,
      xpub: address,
      blockHeight:
        operationsWithSubs.length === 0 ? 0 : blockInfo.height || initialAccount?.blockHeight,
      balance: new BigNumber(nativeBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      operations: operationsWithSubs,
      subAccounts,
      operationsCount: operationsWithSubs.length,
    };
    return res;
  };
}
