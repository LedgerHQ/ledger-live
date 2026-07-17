/*
 * When the comment is invalid.
 */
export class TonCommentInvalid extends Error {
  override name = "TonCommentInvalid";
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonMinimumRequired extends Error {
  override name = "TonMinimumRequired";
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonExcessFee extends Error {
  override name = "TonExcessFee";
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonNotEnoughBalanceInParentAccount extends Error {
  override name = "TonNotEnoughBalanceInParentAccount";
}
