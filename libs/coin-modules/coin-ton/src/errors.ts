import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * When the comment is invalid.
 */
export const TonCommentInvalid = createCustomErrorClass("TonCommentInvalid");

/*
 * When the transaction is a jetton transfer.
 */
export const TonMinimumRequired = createCustomErrorClass("TonMinimumRequired");

/*
 * When the transaction is a jetton transfer.
 */
export const TonExcessFee = createCustomErrorClass("TonExcessFee");

/*
 * When the transaction is a jetton transfer.
 */
export const TonNotEnoughBalanceInParentAccount = createCustomErrorClass(
  "TonNotEnoughBalanceInParentAccount",
);
