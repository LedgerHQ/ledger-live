import { createCustomErrorClass } from "@ledgerhq/errors";

export const SequenseNumberTooOldError = createCustomErrorClass(
  "SequenseNumberTooOld"
);

export const SequenseNumberTooNewError = createCustomErrorClass(
  "SequenseNumberTooNew"
);

export const TransactionExpiredError =
  createCustomErrorClass("TransactionExpired");
