import { createCustomErrorClass } from "@ledgerhq/errors";

/** Decoded summary of `extras.result_xdr` (Horizon transaction result XDR). */
export type StellarDecodedResultXdr =
  | {
      feeChargedStroops: string;
      resultSwitch: string;
    }
  | {
      decodeFailed: true;
      rawResultXdrBase64: string;
    };

export type StellarBroadcastFailedFields = {
  documentationSummary: string;
  horizonTransactionCode: string;
  horizonOperationCodes: string[] | undefined;
  resultXdrSwitchName: string | undefined;
  feeChargedStroops: string | undefined;
  stellarDocUrl: string;
  decodedResultXdr: StellarDecodedResultXdr | undefined;
  decodedEnvelopeXdr: string;
};

export const StellarBroadcastFailedError =
  createCustomErrorClass<StellarBroadcastFailedFields>("StellarBroadcastFailedError");

export const StellarBurnAddressError = createCustomErrorClass("StellarBurnAddressError");
export const StellarAssetRequired = createCustomErrorClass("StellarAssetRequired");
export const StellarMuxedAccountNotExist = createCustomErrorClass("StellarMuxedAccountNotExist");
export const StellarWrongMemoFormat = createCustomErrorClass("StellarWrongMemoFormat");
export const StellarAssetNotAccepted = createCustomErrorClass("StellarAssetNotAccepted");
export const StellarAssetNotFound = createCustomErrorClass("StellarAssetNotFound");
export const StellarNotEnoughNativeBalance = createCustomErrorClass(
  "StellarNotEnoughNativeBalance",
);
export const StellarFeeSmallerThanRecommended = createCustomErrorClass(
  "StellarFeeSmallerThanRecommended",
);
export const StellarFeeSmallerThanBase = createCustomErrorClass("StellarFeeSmallerThanBase");
export const StellarNotEnoughNativeBalanceToAddTrustline = createCustomErrorClass(
  "StellarNotEnoughNativeBalanceToAddTrustline",
);
export const StellarSourceHasMultiSign = createCustomErrorClass("StellarSourceHasMultiSign");
