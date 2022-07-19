import { createCustomErrorClass } from "@ledgerhq/errors";

export const HeliumMemoTooLong = createCustomErrorClass("Memo is too long");

export const ValidatorAddressRequired = createCustomErrorClass(
  "ValidatorAddressRequired"
);

export const OldValidatorAddressRequired = createCustomErrorClass(
  "OldValidatorAddressRequired"
);

export const NewValidatorAddressRequired = createCustomErrorClass(
  "NewValidatorAddressRequired"
);

export const ValidatorMinAmountRequired = createCustomErrorClass(
  "Validators require a minimum amount of 10,000 HNT."
);
