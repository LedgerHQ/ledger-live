/*
 * When the comment is invalid.
 */
export class TonCommentInvalid extends Error {
  override name = "TonCommentInvalid";
  constructor(message?: string) {
    super(message ?? "TonCommentInvalid");
  }
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonMinimumRequired extends Error {
  override name = "TonMinimumRequired";
  constructor(message?: string) {
    super(message ?? "TonMinimumRequired");
  }
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonExcessFee extends Error {
  override name = "TonExcessFee";
  constructor(message?: string) {
    super(message ?? "TonExcessFee");
  }
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonNotEnoughBalanceInParentAccount extends Error {
  override name = "TonNotEnoughBalanceInParentAccount";
  constructor(message?: string) {
    super(message ?? "TonNotEnoughBalanceInParentAccount");
  }
}
