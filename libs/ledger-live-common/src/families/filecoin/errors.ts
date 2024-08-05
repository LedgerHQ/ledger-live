import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * When the recipient is non f0, f4 or eth address during token transfer
 */
export const InvalidRecipientForTokenTransfer = createCustomErrorClass(
  "InvalidRecipientForTokenTransfer",
);

/*
 * When the fee estimation endpoint fails
 */
export const FilecoinFeeEstimationFailed = createCustomErrorClass("FilecoinFeeEstimationFailed");
