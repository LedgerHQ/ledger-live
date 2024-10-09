import { createCustomErrorClass } from "@ledgerhq/errors";

export const ScannedOldImportQrCode = createCustomErrorClass("ScannedOldImportQrCode");
export const ScannedNewImportQrCode = createCustomErrorClass("ScannedNewImportQrCode");
export const ScannedInvalidQrCode = createCustomErrorClass("ScannedInvalidQrCode");
export const InvalidDigitsError = createCustomErrorClass("InvalidDigitsError");
export const InvalidEncryptionKeyError = createCustomErrorClass("InvalidEncryptionKeyError");
export const TrustchainEjected = createCustomErrorClass("TrustchainEjected");
export const TrustchainNotAllowed = createCustomErrorClass("TrustchainNotAllowed");
export const TrustchainOutdated = createCustomErrorClass("TrustchainOutdated");
export const TrustchainNotFound = createCustomErrorClass("TrustchainNotFound");
export const NoTrustchainInitialized = createCustomErrorClass("NoTrustchainInitialized");
export const TrustchainAlreadyInitialized = createCustomErrorClass("TrustchainAlreadyInitialized");
export const TrustchainAlreadyInitializedWithOtherSeed = createCustomErrorClass(
  "TrustchainAlreadyInitializedWithOtherSeed",
);

export const QRCodeWSClosed = createCustomErrorClass<{ time: number }>("QRCodeWSClosed");
