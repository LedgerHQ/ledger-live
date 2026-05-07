import { createCustomErrorClass } from "@ledgerhq/errors";

export const AleoAmountRecordRequired = createCustomErrorClass("AleoAmountRecordRequired");
export const AleoFeeRecordRequired = createCustomErrorClass("AleoFeeRecordRequired");
export const AleoTwoRecordsRequired = createCustomErrorClass("AleoTwoRecordsRequired");
export const AleoFeeRecordInsufficientBalance = createCustomErrorClass(
  "AleoFeeRecordInsufficientBalance",
);
export const AleoApiConfigurationResetError = createCustomErrorClass(
  "AleoApiConfigurationResetError",
);
export const AleoTooManyRecordsSelected = createCustomErrorClass("AleoTooManyRecordsSelected");
export const AleoAmountTooLargeForTransaction = createCustomErrorClass(
  "AleoAmountTooLargeForTransaction",
);
