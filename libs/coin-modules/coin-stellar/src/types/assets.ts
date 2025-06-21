import { Asset } from "@ledgerhq/coin-framework/api/types";

export type StellarToken = {
  assetIssuer: string;
  assetCode: string;
};
export type StellarAsset = Asset<StellarToken>;

export type StellarMemoKind = "MEMO_TEXT" | "MEMO_ID" | "MEMO_HASH" | "MEMO_RETURN";
