import { type Asset } from "@ledgerhq/coin-framework/api/types";

export type SuiAsset = Asset<SuiTokenInformation>;

export type SuiTokenInformation = {
  coinType: string;
};
