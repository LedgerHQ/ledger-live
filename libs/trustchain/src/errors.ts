import { createCustomErrorClass } from "@ledgerhq/errors";

export const InvalidDigitsError = createCustomErrorClass("InvalidDigitsError");
export const InvalidEncryptionKeyError = createCustomErrorClass("InvalidEncryptionKeyError");
export const TrustchainEjected = createCustomErrorClass("TrustchainEjected");
export const TrustchainNotAllowed = createCustomErrorClass("TrustchainNotAllowed");
export const TrustchainOutdated = createCustomErrorClass("TrustchainOutdated");
