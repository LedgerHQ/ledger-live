import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation } from "./utils";
import { BaseTokenLikeAsset } from "./types";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization";
import { StellarBurnAddressError, StellarOperation } from "@ledgerhq/coin-stellar/types";
import { STELLAR_BURN_ADDRESS } from "@ledgerhq/coin-stellar/logic";
import { getEnv } from "@ledgerhq/live-env";
import { Pagination } from "@ledgerhq/coin-framework/lib-es/api/types";
import { buildSubAccounts } from "./buildSubAccounts";

function buildPaginationParams(
  network: string,
  isInitSync: boolean,
  lastPagingToken: string,
): Pagination {
  switch (network) {
    case "stellar":
      console.log("Get ACCount Stellar");
      return isInitSync
        ? { limit: getEnv("API_STELLAR_HORIZON_INITIAL_FETCH_MAX_OPERATIONS"), minHeight: 0 }
        : { pagingToken: lastPagingToken, minHeight: 0 };

    case "xrp":
    default:
      // fallback to minHeight if pagingToken is not available
      return {
        minHeight: isInitSync ? 0 : parseInt(lastPagingToken || "0", 10),
      };
  }
}

export function genericGetAccountShape(network: string, kind: string): GetAccountShape {
  return async (info, syncConfig) => {
    console.log("genericGetAccountShape info ", info);
    console.log("genericGetAccountShape syncConfig ", syncConfig);
    const { address, initialAccount, currency, derivationMode } = info;

    if (address === STELLAR_BURN_ADDRESS) {
      throw new StellarBurnAddressError();
    }

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: address,
      derivationMode,
    });

    const blockInfo = await getAlpacaApi(network, kind).lastBlock();
    console.log("blockInfo", blockInfo);
    const balanceRes = await getAlpacaApi(network, kind).getBalance(address);
    console.log("balanceRes", balanceRes);
    const nativeAsset = balanceRes.find(b => b.asset.type === "native");
    const nativeBalance = BigInt(nativeAsset?.value ?? "0");
    const lockedBalance = BigInt(nativeAsset?.locked ?? "0");
    let spendableBalance = nativeBalance > lockedBalance ? nativeBalance - lockedBalance : 0n;

    const oldOps = (initialAccount?.operations || []) as StellarOperation[];
    console.log("oldOps", oldOps);
    const lastPagingToken = oldOps[0]?.extra?.pagingToken || "";
    const isInitSync = lastPagingToken === "";

    const pagination = buildPaginationParams(network, isInitSync, lastPagingToken);
    const [newCoreOps] = await getAlpacaApi(network, kind).listOperations(address, pagination);
    console.log("newCoreOps", newCoreOps);
    // FIXME: adaptCoreOperationToLiveOperation should not be StellarOperation but generic
    const newOps = newCoreOps.map(op =>
      adaptCoreOperationToLiveOperation(accountId, op),
    ) as StellarOperation[];
    const mergedOps = mergeOps(oldOps, newOps) as StellarOperation[];
    console.log("mergedOps", mergedOps);

    // NOTE: was it really what was done before, also, what's the use of this
    // const assetOps = mergedOps.filter(op => op.type === "NONE");
    // const assetOps = mergedOps.filter(op => op.type === "NONE");
    // NOTE: trying out original way
    const assetOperations: StellarOperation[] = [];

    // NOTE: why this old logic doesn't work
    mergedOps.forEach(operation => {
      if (
        operation?.extra?.assetCode &&
        operation?.extra?.assetIssuer &&
        !["OPT_IN", "OPT_OUT"].includes(operation.type)
      ) {
        assetOperations.push(operation);
      }
    });
    console.log({ assetOperations });
    // Instead of building TokenAccounts, we use enriched AssetInfo objects
    const tokenAssets: BaseTokenLikeAsset[] = balanceRes
      .filter(b => b.asset?.type === "token")
      .map(b => ({
        asset_code: b.asset.assetCode,
        asset_issuer: b.asset.assetIssuer,
        balance: b.value.toString(),
        decimals: 7, // Default Stellar token decimals
        creationDate: new Date(), // Optional: replace if available
        operations: newCoreOps.filter(
          op =>
            op.asset?.assetCode === b.asset.assetCode &&
            op.asset?.assetIssuer === b.asset.assetIssuer,
        ),
      }));

    const accountInfo = await getAlpacaApi(network, kind).getAccountInfo(address);
    console.log({ accountInfo });
    // TODO: make this more generic this looks to be only for stellar
    if (accountInfo?.spendableBalance) {
      spendableBalance = BigInt(accountInfo.spendableBalance);
    }
    const subAccounts =
      buildSubAccounts({
        currency,
        accountId,
        assets: accountInfo.assets ?? [],
        syncConfig,
        operations: assetOperations,
      }) || [];

    console.log("tokenAssets", tokenAssets);
    const operationsWithSubs = mergedOps.map(op => {
      const subOperations = inferSubOperations(op.hash, subAccounts);
      console.log({ subAccounts, subOperations });

      return {
        ...op,
        subOperations,
      };
    });

    console.log("operationsWithSubs", operationsWithSubs);
    const res = {
      id: accountId,
      xpub: address,
      blockHeight: blockInfo.height,
      balance: new BigNumber(nativeBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      operations: operationsWithSubs,
      subAccounts,
      operationsCount: operationsWithSubs.length,
    };
    console.log({ ACCOUNTSHAPERESULT: res });
    return res;
  };
}
