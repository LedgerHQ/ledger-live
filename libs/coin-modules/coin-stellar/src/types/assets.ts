import { Asset } from "@ledgerhq/coin-framework/api/types";

export type StellarToken = {
  assetIssuer: string;
  assetCode: string;
};
export type StellarAsset = Asset<StellarToken>;
