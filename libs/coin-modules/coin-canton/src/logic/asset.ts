import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/index";

export function instrumentAsset(
  nativeInstrumentId: string,
  instrumentId: string,
  adminId: string,
): AssetInfo {
  return instrumentId === nativeInstrumentId
    ? { type: "native" }
    : { type: "token", assetReference: instrumentId, assetOwner: adminId };
}
