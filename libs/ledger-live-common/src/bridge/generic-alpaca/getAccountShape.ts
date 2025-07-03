import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation } from "./utils";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization";
import { StellarBurnAddressError } from "@ledgerhq/coin-stellar/types";
import { STELLAR_BURN_ADDRESS } from "@ledgerhq/coin-stellar/logic";
// import { getEnv } from "@ledgerhq/live-env";
// import { Pagination } from "@ledgerhq/coin-framework/lib-es/api/types";
import { buildSubAccounts, OperationCommon } from "./buildSubAccounts";

// NOTE: we should recheck this whole thing
// making sure we're covered by tests on this also
// function buildPaginationParams(
//   network: string,
//   isInitSync: boolean,
//   lastPagingToken: string,
// ): Pagination {
//   switch (network) {
//     case "stellar":
//       return isInitSync
//         ? { limit: getEnv("API_STELLAR_HORIZON_INITIAL_FETCH_MAX_OPERATIONS"), minHeight: 0 }
//         : { pagingToken: lastPagingToken, minHeight: 0 };

//     case "xrp":
//     default:
//       // fallback to minHeight if pagingToken is not available
//       return {
//         minHeight: isInitSync ? 0 : parseInt(lastPagingToken || "0", 10),
//       };
//   }
// }

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
    let spendableBalance = nativeBalance > lockedBalance ? nativeBalance - lockedBalance : 0n;

    const oldOps = (initialAccount?.operations || []) as OperationCommon[];
    const lastPagingToken = oldOps[0]?.extra?.pagingToken || "";
    // const isInitSync = lastPagingToken === "";

    // const pagination = buildPaginationParams(network, isInitSync, lastPagingToken);
    const [newCoreOps] = await getAlpacaApi(network, kind).listOperations(address, lastPagingToken);
    // FIXME: adaptCoreOperationToLiveOperation should not be StellarOperation but generic
    const newOps = newCoreOps.map(op =>
      adaptCoreOperationToLiveOperation(accountId, op),
    ) as OperationCommon[];
    const mergedOps = mergeOps(oldOps, newOps) as OperationCommon[];

    // NOTE: was it really what was done before, also, what's the use of this
    // const assetOps = mergedOps.filter(op => op.type === "NONE");
    // const assetOps = mergedOps.filter(op => op.type === "NONE");
    // NOTE: trying out original way
    const assetOperations: OperationCommon[] = [];

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

    const accountInfo = await getAlpacaApi(network, kind).getAccountInfo(address);
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
      blockHeight: blockInfo.height,
      balance: new BigNumber(nativeBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      operations: operationsWithSubs,
      subAccounts,
      operationsCount: operationsWithSubs.length,
    };
    return res;
  };
}
