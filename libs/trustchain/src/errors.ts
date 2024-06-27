import { createCustomErrorClass } from "@ledgerhq/errors";

export const InvalidDigitsError = createCustomErrorClass("InvalidDigitsError");
export const InvalidEncryptionKeyError = createCustomErrorClass("InvalidEncryptionKeyError");
export const TrustchainEjected = createCustomErrorClass("TrustchainEjected");
