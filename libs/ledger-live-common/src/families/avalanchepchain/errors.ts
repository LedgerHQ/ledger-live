import { createCustomErrorClass } from "@ledgerhq/errors";

export const AvalancheInvalidDateTimeError = createCustomErrorClass(
  "AvalancheInvalidDateTimeError"
);

export const AvalancheMinimumAmountError = createCustomErrorClass(
  "AvalancheMinimumAmountError"
);
