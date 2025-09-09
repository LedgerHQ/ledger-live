import { createCustomErrorClass } from "@ledgerhq/errors";

export const HederaAddAccountError = createCustomErrorClass("HederaAddAccountError");
export const HederaRecipientInvalidChecksum = createCustomErrorClass(
  "HederaRecipientInvalidChecksum",
);
export const HederaInsufficientFundsForAssociation = createCustomErrorClass(
  "HederaInsufficientFundsForAssociation",
);
export const HederaRecipientTokenAssociationRequired = createCustomErrorClass(
  "HederaRecipientTokenAssociationRequired",
);
export const HederaRecipientTokenAssociationUnverified = createCustomErrorClass(
  "HederaRecipientTokenAssociationUnverified",
);
