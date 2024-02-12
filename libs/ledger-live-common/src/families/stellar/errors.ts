import { createCustomErrorClass } from "@ledgerhq/errors";

export const StellarMemoRecommended = createCustomErrorClass("StellarMemoRecommended");
export const StellarWrongMemoFormat = createCustomErrorClass("StellarWrongMemoFormat");
export const StellarAssetRequired = createCustomErrorClass("StellarAssetRequired");
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
export const StellarMuxedAccountNotExist = createCustomErrorClass("StellarMuxedAccountNotExist");
export const StellarSourceHasMultiSign = createCustomErrorClass("StellarSourceHasMultiSign");
export const StellarBurnAddressError = createCustomErrorClass("StellarBurnAddressError");
