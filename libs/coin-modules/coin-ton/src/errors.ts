/*
 * When the comment is invalid.
 */
export class TonCommentInvalid extends Error {
  override name = "TonCommentInvalid";
  constructor(message = "TonCommentInvalid") {
    super(message);
  }
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonMinimumRequired extends Error {
  override name = "TonMinimumRequired";
  constructor(message = "TonMinimumRequired") {
    super(message);
  }
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonExcessFee extends Error {
  override name = "TonExcessFee";
  constructor(message = "TonExcessFee") {
    super(message);
  }
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonNotEnoughBalanceInParentAccount extends Error {
  override name = "TonNotEnoughBalanceInParentAccount";
  constructor(message = "TonNotEnoughBalanceInParentAccount") {
    super(message);
  }
}
