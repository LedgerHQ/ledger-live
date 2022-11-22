import { createCustomErrorClass } from "@ledgerhq/errors";

export const DecimalsLimitReached = createCustomErrorClass(
  "DecimalsLimitReached"
);

export const MinDelegatedAmountError = createCustomErrorClass(
  "MinDelegatedAmountError"
);

export const MinUndelegatedAmountError = createCustomErrorClass(
  "MinUndelegatedAmountError"
);
