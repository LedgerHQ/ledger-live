import { Asset } from "@ledgerhq/coin-framework/api/types";

export type StellarToken = {
  assetIssuer: string;
  assetCode: string;
  // blockTime?: Date;
  // index?: string;
  // ledgerOpType?: string;
  // pagingToken?: string | undefined;
};
export type StellarAsset = Asset;
