import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";

export type Instrument = { instrumentId: string; instrumentAdmin?: string };

export type NativeInstrument = Required<Instrument>;

// A target without an admin matches every admin.
export const isInstrument = (
  target: Instrument,
  instrumentId: string,
  instrumentAdmin: string | undefined,
): boolean =>
  instrumentId === target.instrumentId &&
  (!target.instrumentAdmin || instrumentAdmin === target.instrumentAdmin);

export function instrumentAsset(
  native: NativeInstrument,
  instrumentId: string,
  adminId: string,
): AssetInfo {
  return isInstrument(native, instrumentId, adminId)
    ? { type: "native" }
    : { type: "token", assetReference: instrumentId, assetOwner: adminId };
}

/** `undefined` for an asset Canton cannot transfer: a template, or a token without a reference. */
export function assetInstrument(
  asset: AssetInfo,
  nativeInstrumentId: string,
): Instrument | undefined {
  if (asset.type === "native") return { instrumentId: nativeInstrumentId };
  const assetReference = "assetReference" in asset ? asset.assetReference : undefined;
  if (asset.type === "template" || !assetReference) return undefined;
  const assetOwner = "assetOwner" in asset ? asset.assetOwner : undefined;
  return { instrumentId: assetReference, ...(assetOwner ? { instrumentAdmin: assetOwner } : {}) };
}

export function instrumentOf(asset: AssetInfo, nativeInstrumentId: string): Instrument {
  const instrument = assetInstrument(asset, nativeInstrumentId);
  // Without an admin the gateway spends the DSO's holdings, while validation could read another admin's.
  const isOwnerlessUnderNativeId =
    asset.type !== "native" &&
    instrument?.instrumentId === nativeInstrumentId &&
    !instrument.instrumentAdmin;
  if (!instrument || isOwnerlessUnderNativeId) {
    throw new InvalidParameterError(`canton: cannot transfer asset ${JSON.stringify(asset)}`);
  }
  return instrument;
}
