import { AssetInfo } from "@ledgerhq/coin-framework/lib/api/types";

export type EvmToken = {
  standard: "erc";
  contractAddress: string;
};

export function isNative(asset: AssetInfo): asset is { type: "native" } {
  return asset.type === "native";
}
