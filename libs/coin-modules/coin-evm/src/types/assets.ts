import { AssetInfo } from "@ledgerhq/coin-framework/lib/api/types";

export function isNative(asset: AssetInfo): asset is { type: "native" } {
  return asset.type === "native";
}
