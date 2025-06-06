import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation } from "./utils";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization";

type BaseTokenLikeAsset = {
  asset_code: string;
  asset_issuer: string;
  balance: string;
  decimals: number;
  creationDate: Date;
  operations: any[]; // or `Operation[]` if you can import it cleanly
};

import { StellarBurnAddressError, StellarOperation } from "@ledgerhq/coin-stellar/types";
import { STELLAR_BURN_ADDRESS } from "@ledgerhq/coin-stellar/logic";
import { getEnv } from "@ledgerhq/live-env";
import { Pagination } from "@ledgerhq/coin-framework/lib-es/api/types";

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
    const balanceRes = await getAlpacaApi(network, kind).getBalance(address);

    const nativeAsset = balanceRes.find(b => b.asset.type === "native");
    const nativeBalance = BigInt(nativeAsset?.value ?? "0");
    const lockedBalance = BigInt(nativeAsset?.locked ?? "0");
    const spendableBalance = nativeBalance > lockedBalance ? nativeBalance - lockedBalance : 0n;

    const oldOps = (initialAccount?.operations || []) as StellarOperation[];
    const lastPagingToken = oldOps[0]?.extra?.pagingToken || "";
    const isInitSync = lastPagingToken === "";

    const pagination = buildPaginationParams(network, isInitSync, lastPagingToken);
    const [newCoreOps] = await getAlpacaApi(network, kind).listOperations(address, pagination);

    const newOps = newCoreOps.map(op =>
      adaptCoreOperationToLiveOperation(accountId, op),
    ) as StellarOperation[];
    const mergedOps = mergeOps(oldOps, newOps) as StellarOperation[];

    const assetOps = mergedOps.filter(
      op =>
        op.extra?.assetCode && op.extra?.assetIssuer && !["OPT_IN", "OPT_OUT"].includes(op.type),
    );

    // Instead of building TokenAccounts, we use enriched AssetInfo objects
    const tokenAssets: BaseTokenLikeAsset[] = balanceRes
      .filter(b => b.asset?.type === "token")
      .map(b => ({
        asset_code: b.asset.assetCode,
        asset_issuer: b.asset.assetIssuer,
        balance: b.value.toString(),
        decimals: 7, // Default Stellar token decimals
        creationDate: new Date(), // Optional: replace if available
        operations: assetOps.filter(
          op =>
            op.extra?.assetCode === b.asset.assetCode &&
            op.extra?.assetIssuer === b.asset.assetIssuer,
        ),
      }));

    const operationsWithSubs = mergedOps.map(op => ({
      ...op,
      subOperations: inferSubOperations(op.hash, []),
    }));

    return {
      id: accountId,
      xpub: address,
      blockHeight: blockInfo.height,
      balance: new BigNumber(nativeBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      operations: operationsWithSubs,
      operationsCount: operationsWithSubs.length,
      tokenAssets,
    };
  };
}
