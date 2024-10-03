import { createCustomErrorClass } from "@ledgerhq/errors";

export const NotEnoughFeeError = createCustomErrorClass(
  "NotEnoughFeeError"
);

export const TransactionMassExceededError = createCustomErrorClass(
  "TransactionMassExceededError"
);

export const EmptyRecipientError = createCustomErrorClass(
  "EmptyRecipientError"
);


