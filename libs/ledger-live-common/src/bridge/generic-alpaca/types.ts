import type { Operation } from "@ledgerhq/coin-framework/api/index";

export type BaseTokenLikeAsset = {
  asset_code: string;
  asset_issuer: string;
  balance: string;
  decimals: number;
  creationDate: Date;
  operations: Operation[];
};
