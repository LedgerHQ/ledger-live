import { Asset } from "@ledgerhq/coin-framework/api/types";

export type EvmToken = {
  standard: "erc";
  contractAddress: string;
};

export function isNative(asset: EvmAsset): asset is { type: "native" } {
  return asset.type === "native";
}

export type EvmAsset = Asset<EvmToken>;
