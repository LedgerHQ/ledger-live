/*
 * When the memo is greater than 32 characters
 */
export class InvalidMemoMina extends Error {
  override name = "InvalidMemoMina";
  constructor(message = "InvalidMemoMina") {
    super(message);
  }
}

/*
 * When the user sends less than the account creation fee of 1 MINA
 */
export class AccountCreationFeeWarning extends Error {
  override name = "AccountCreationFeeWarning";
  constructor(message = "AccountCreationFeeWarning", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

/*
 * When the amount is less than the account creation fee of 1 MINA
 */
export class AmountTooSmall extends Error {
  override name = "AmountTooSmall";
  constructor(message = "AmountTooSmall", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
