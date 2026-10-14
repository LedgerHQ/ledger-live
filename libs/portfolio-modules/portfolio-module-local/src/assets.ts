import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { LocalNetwork } from "./types";

export type AssetMetadata = LocalNetwork["nativeAsset"];

export type AssetBalance = { asset: AssetInfo; value: bigint; locked: bigint };

/** How the service names an asset: "native", or its reference (contract address, token id...). */
export function assetKeyOf(asset: AssetInfo): string {
  if (asset.type === "native") return "native";
  return ("assetReference" in asset && asset.assetReference) || asset.type;
}

export function assetMetadataOf(asset: AssetInfo, nativeAsset: AssetMetadata): AssetMetadata {
  if (asset.type === "native") return nativeAsset;
  return {
    name: asset.name ?? assetKeyOf(asset),
    ticker: asset.unit?.code ?? "",
    decimals: asset.unit?.magnitude ?? 0,
  };
}

/** Balances summed per asset key, in the order the assets first appear. */
export function sumByAsset(balances: Balance[]): Map<string, AssetBalance> {
  const sums = new Map<string, AssetBalance>();
  for (const { asset, value, locked = 0n } of balances) {
    const key = assetKeyOf(asset);
    const sum = sums.get(key) ?? { asset, value: 0n, locked: 0n };
    sums.set(key, { asset: sum.asset, value: sum.value + value, locked: sum.locked + locked });
  }
  return sums;
}
