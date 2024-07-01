import { createCustomErrorClass } from "@ledgerhq/errors";

export const InvalidAddressBecauseAlreadyDelegated = createCustomErrorClass(
  "InvalidAddressBecauseAlreadyDelegated",
);
export const UnsupportedTransactionType = createCustomErrorClass("UnsupportedTransactionType");
