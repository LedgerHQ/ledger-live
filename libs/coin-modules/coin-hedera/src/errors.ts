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
export const HederaRecipientEvmAddressVerificationRequired = createCustomErrorClass(
  "HederaRecipientEvmAddressVerificationRequired",
);
export const HederaRedundantStakingNodeIdError = createCustomErrorClass(
  "HederaRedundantStakingNodeIdError",
);
export const HederaInvalidStakingNodeIdError = createCustomErrorClass(
  "HederaInvalidStakingNodeIdError",
);
export const HederaNoStakingRewardsError = createCustomErrorClass("HederaNoStakingRewardsError");
export const HederaMemoIsTooLong = createCustomErrorClass("HederaMemoIsTooLong");
