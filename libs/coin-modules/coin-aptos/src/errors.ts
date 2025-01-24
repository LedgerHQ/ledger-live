import { createCustomErrorClass } from "@ledgerhq/errors";

export const SequenceNumberTooOldError = createCustomErrorClass("SequenceNumberTooOld");

export const SequenceNumberTooNewError = createCustomErrorClass("SequenceNumberTooNew");

export const TransactionExpiredError = createCustomErrorClass("TransactionExpired");
