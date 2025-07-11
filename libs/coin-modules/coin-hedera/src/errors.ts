import { createCustomErrorClass } from "@ledgerhq/errors";

export const HederaAddAccountError = createCustomErrorClass("HederaAddAccountError");
export const HederaRedundantStakingNodeIdError = createCustomErrorClass(
  "HederaRedundantStakingNodeIdError",
);
export const HederaInvalidStakingNodeIdError = createCustomErrorClass(
  "HederaInvalidStakingNodeIdError",
);
