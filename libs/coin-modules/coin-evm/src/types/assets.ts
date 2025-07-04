import { Asset } from "@ledgerhq/coin-framework/api/types";

export type EvmToken = {
  standard: "erc";
  contractAddress: string;
};

export type EvmAsset = Asset<EvmToken>;
