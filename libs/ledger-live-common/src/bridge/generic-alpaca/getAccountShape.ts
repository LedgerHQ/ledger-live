import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation } from "./utils";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization";
import { buildSubAccounts } from "./buildSubAccounts";

import { StellarBurnAddressError, StellarOperation } from "@ledgerhq/coin-stellar/types";
import { STELLAR_BURN_ADDRESS } from "@ledgerhq/coin-stellar/bridge/logic";
import { getEnv } from "@ledgerhq/live-env";
import { Pagination } from "@ledgerhq/coin-framework/lib-es/api/types";

function buildPaginationParams(
  network: string,
  isInitSync: boolean,
  lastPagingToken: string,
): Pagination {
  switch (network) {
    case "stellar":
      return isInitSync
        ? { limit: getEnv("API_STELLAR_HORIZON_INITIAL_FETCH_MAX_OPERATIONS") }
        : { pagingToken: lastPagingToken };

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

    // NOTE: Stellar-specific safety mechanism — Ledger's internal burn address should never sync
    if (address === STELLAR_BURN_ADDRESS) {
      throw new StellarBurnAddressError();
    }

    // Generate a stable account ID for tracking account in Ledger Live
    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: address,
      derivationMode,
    });

    const blockInfo = await getAlpacaApi(network, kind).lastBlock();

    // NOTE: get all assets (native + tokens), find native XLM balance
    const balanceRes = await getAlpacaApi(network, kind).getBalance(address);

    // NOTE: find native XLM balance among returned balances
    const nativeAsset = balanceRes.find(b => b.asset.type === "native");
    const nativeBalance = BigInt(nativeAsset?.value ?? "0");

    // NOTE: determine locked portion
    const lockedBalance = BigInt(nativeAsset?.locked ?? "0");

    // Compute how much is actually spendable
    const spendableBalance = nativeBalance > lockedBalance ? nativeBalance - lockedBalance : 0n;

    // Load previous operations (used to avoid re-fetching everything)
    const oldOps = (initialAccount?.operations || []) as StellarOperation[];

    // NOTE: Stellar uses `pagingToken` instead of `blockHeight` to paginate ops
    const lastPagingToken = oldOps[0]?.extra?.pagingToken || "";
    const isInitSync = lastPagingToken === "";

    const pagination = buildPaginationParams(network, isInitSync, lastPagingToken);
    const [newCoreOps] = await getAlpacaApi(network, kind).listOperations(address, pagination);

    // Convert core API operations to Ledger Live-compatible ones
    const newOps = newCoreOps.map(op =>
      adaptCoreOperationToLiveOperation(accountId, op),
    ) as StellarOperation[];

    // Merge new and old operations (deduplication is handled)
    const mergedOps = mergeOps(oldOps, newOps) as StellarOperation[];

    // NOTE: Stellar: filter only token-related operations for subAccount construction
    const assetOps = mergedOps.filter(
      op =>
        op.extra?.assetCode && op.extra?.assetIssuer && !["OPT_IN", "OPT_OUT"].includes(op.type),
    );

    // NOTE: Stellar: build token subAccounts (e.g. USDC on Stellar)

    const subAccounts =
      buildSubAccounts({
        currency,
        accountId,
        assets: balanceRes
          .filter(b => b.asset?.type !== "native")
          .map(b => ({
            asset_code: b.asset.assetCode,
            asset_issuer: b.asset.assetIssuer,
            balance: b.value.toString(),
            decimals: 7,
            // limit: b.limit?.toString(),
            // buying_liabilities: b.buying_liabilities,
            // selling_liabilities: b.selling_liabilities,
            // is_authorized: b.is_authorized,
            // is_authorized_to_maintain_liabilities: b.is_authorized_to_maintain_liabilities,
            // is_clawback_enabled: b.is_clawback_enabled,
          })),
        operations: assetOps,
        syncConfig,
      }) ?? [];

    // NOTE: Stellar: attach inferred subOperations to parent operations
    const operationsWithSubs = mergedOps.map(op => ({
      ...op,
      subOperations: inferSubOperations(op.hash, subAccounts),
    }));

    return {
      id: accountId,
      xpub: address,
      blockHeight: blockInfo.height,
      balance: new BigNumber(nativeBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      operations: operationsWithSubs,
      operationsCount: operationsWithSubs.length,
      subAccounts,
    };
  };
}
