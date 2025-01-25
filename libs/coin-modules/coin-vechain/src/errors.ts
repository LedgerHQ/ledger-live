import { createCustomErrorClass } from "@ledgerhq/errors";

export const NotEnoughVTHO = createCustomErrorClass("NotEnoughVTHO");
export const MustBeVechain = createCustomErrorClass("MustBeVechain");
export const ImpossibleToCalculateAmountAndFees = createCustomErrorClass(
  "ImpossibleToCalculateAmountAndFees",
);
