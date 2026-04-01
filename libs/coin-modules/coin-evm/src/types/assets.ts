import { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";

export function isNative(asset: AssetInfo): asset is { type: "native" } {
  return asset.type === "native";
}
