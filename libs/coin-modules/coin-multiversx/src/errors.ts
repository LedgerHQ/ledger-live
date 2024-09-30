import { createCustomErrorClass } from "@ledgerhq/errors";

export const MultiversxDecimalsLimitReached = createCustomErrorClass(
  "MultiversxDecimalsLimitReached",
);

export const MultiversxMinDelegatedAmountError = createCustomErrorClass(
  "MultiversxMinDelegatedAmountError",
);

export const MultiversxMinUndelegatedAmountError = createCustomErrorClass(
  "MultiversxMinUndelegatedAmountError",
);

export const MultiversxDelegationBelowMinimumError = createCustomErrorClass(
  "MultiversxDelegationBelowMinimumError",
);

export const NotEnoughEGLDForFees = createCustomErrorClass("NotEnoughEGLDForFees");
