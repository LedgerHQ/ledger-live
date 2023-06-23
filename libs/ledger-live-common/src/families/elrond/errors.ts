import { createCustomErrorClass } from "@ledgerhq/errors";

export const ElrondDecimalsLimitReached = createCustomErrorClass("ElrondDecimalsLimitReached");

export const ElrondMinDelegatedAmountError = createCustomErrorClass(
  "ElrondMinDelegatedAmountError",
);

export const ElrondMinUndelegatedAmountError = createCustomErrorClass(
  "ElrondMinUndelegatedAmountError",
);

export const ElrondDelegationBelowMinimumError = createCustomErrorClass(
  "ElrondDelegationBelowMinimumError",
);

export const NotEnoughEGLDForFees = createCustomErrorClass("NotEnoughEGLDForFees");
