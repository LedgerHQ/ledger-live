import { createCustomErrorClass } from "@ledgerhq/errors";

export const FreshAddressIndexInvalid = createCustomErrorClass(
  "FreshAddressIndexInvalid"
);

export const UnsupportedDerivation = createCustomErrorClass(
  "UnsupportedDerivation"
);
