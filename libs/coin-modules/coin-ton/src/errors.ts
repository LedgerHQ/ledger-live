/*
 * When the comment is invalid.
 */
export class TonCommentInvalid extends Error {
  override name = "TonCommentInvalid";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TonCommentInvalid");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonMinimumRequired extends Error {
  override name = "TonMinimumRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TonMinimumRequired");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonExcessFee extends Error {
  override name = "TonExcessFee";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TonExcessFee");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * When the transaction is a jetton transfer.
 */
export class TonNotEnoughBalanceInParentAccount extends Error {
  override name = "TonNotEnoughBalanceInParentAccount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TonNotEnoughBalanceInParentAccount");
    if (fields) Object.assign(this, fields);
  }
}
