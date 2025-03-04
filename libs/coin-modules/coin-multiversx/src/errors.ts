import { createCustomErrorClass } from "@ledgerhq/errors";

export const MultiversXDecimalsLimitReached = createCustomErrorClass(
  "MultiversXDecimalsLimitReached",
);

export const MultiversXMinDelegatedAmountError = createCustomErrorClass(
  "MultiversXMinDelegatedAmountError",
);

export const MultiversXMinUndelegatedAmountError = createCustomErrorClass(
  "MultiversXMinUndelegatedAmountError",
);

export const MultiversXDelegationBelowMinimumError = createCustomErrorClass(
  "MultiversXDelegationBelowMinimumError",
);

export const NotEnoughEGLDForFees = createCustomErrorClass("NotEnoughEGLDForFees");
