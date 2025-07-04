import { createCustomErrorClass } from "@ledgerhq/errors";

export const HederaAddAccountError = createCustomErrorClass("HederaAddAccountError");
export const HederaRedundantStakedNodeIdError = createCustomErrorClass(
  "HederaRedundantStakedNodeIdError",
);
export const HederaInvalidStakedNodeIdError = createCustomErrorClass(
  "HederaInvalidStakedNodeIdError",
);
