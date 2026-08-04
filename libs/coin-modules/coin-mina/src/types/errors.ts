/*
 * When the memo is greater than 32 characters
 */
export class InvalidMemoMina extends Error {
  override name = "InvalidMemoMina";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidMemoMina");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * When the user sends less than the account creation fee of 1 MINA
 */
export class AccountCreationFeeWarning extends Error {
  override name = "AccountCreationFeeWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AccountCreationFeeWarning");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * When the amount is less than the account creation fee of 1 MINA
 */
export class AmountTooSmall extends Error {
  override name = "AmountTooSmall";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AmountTooSmall");
    if (fields) Object.assign(this, fields);
  }
}
