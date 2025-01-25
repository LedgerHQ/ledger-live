import { createCustomErrorClass } from "@ledgerhq/errors";

export const StellarBurnAddressError = createCustomErrorClass("StellarBurnAddressError");
export const StellarAssetRequired = createCustomErrorClass("StellarAssetRequired");
export const StellarMuxedAccountNotExist = createCustomErrorClass("StellarMuxedAccountNotExist");
export const StellarMemoRecommended = createCustomErrorClass("StellarMemoRecommended");
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
