import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import { assetKeyOf } from "@ledgerhq/portfolio-module-framework";
import type { LocalNetwork } from "./types";

export type AssetMetadata = LocalNetwork["nativeAsset"];

/** What a balance entry or a history point says of its asset; `cal_id` when the client knows it. */
export type ResolvedMetadata = AssetMetadata & { cal_id?: string };

export type AssetBalance = { asset: AssetInfo; value: bigint; locked: bigint };

/** The native asset of the network: keyed "native" (a Cardano token has the type "native" too). */
export const isNativeAsset = (asset: AssetInfo): boolean => assetKeyOf(asset) === "native";

export function assetMetadataOf(asset: AssetInfo, nativeAsset: AssetMetadata): AssetMetadata {
  if (isNativeAsset(asset)) return nativeAsset;
  return {
    name: asset.name ?? assetKeyOf(asset),
    ticker: asset.unit?.code ?? "",
    decimals: asset.unit?.magnitude ?? 0,
  };
}

const identityOf = (asset: AssetInfo): string => {
  const { assetReference = "", assetOwner = "" } = asset as {
    assetReference?: string;
    assetOwner?: string;
  };
  return `${asset.type}|${assetReference}|${assetOwner}`;
};

/**
 * The metadata of the assets of one read: the network's for its native asset, the client's
 * `resolveAsset` answer when it has one, the asset's own name and unit otherwise (a lookup that
 * rejects counts as none). One lookup per asset (type, reference, owner) per resolver.
 */
export function assetResolver({
  nativeAsset,
  resolveAsset,
}: LocalNetwork): (asset: AssetInfo) => Promise<ResolvedMetadata> {
  const resolved = new Map<string, Promise<ResolvedMetadata>>();
  const lookUp = async (asset: AssetInfo): Promise<ResolvedMetadata> => {
    const own = assetMetadataOf(asset, nativeAsset);
    if (isNativeAsset(asset) || !resolveAsset) return own;
    try {
      const found = await resolveAsset(asset);
      if (!found) return own;
      const { cal_id, name, ticker, decimals } = found;
      return { cal_id, name, ticker, decimals };
    } catch {
      return own;
    }
  };
  return asset => {
    const identity = identityOf(asset);
    let metadata = resolved.get(identity);
    if (metadata === undefined) {
      metadata = lookUp(asset);
      resolved.set(identity, metadata);
    }
    return metadata;
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
