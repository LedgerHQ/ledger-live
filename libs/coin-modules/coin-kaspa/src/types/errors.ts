export class NotEnoughFeeError extends Error {
  override name = "NotEnoughFeeError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughFeeError");
    if (fields) Object.assign(this, fields);
  }
}

export class TransactionMassExceededError extends Error {
  override name = "TransactionMassExceededError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TransactionMassExceededError");
    if (fields) Object.assign(this, fields);
  }
}

export class EmptyRecipientError extends Error {
  override name = "EmptyRecipientError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "EmptyRecipientError");
    if (fields) Object.assign(this, fields);
  }
}

export class ReducedAmountUtxoWarning extends Error {
  override name = "ReducedAmountUtxoWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ReducedAmountUtxoWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class UtxoLimitReachedError extends Error {
  override name = "UtxoLimitReachedError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UtxoLimitReachedError");
    if (fields) Object.assign(this, fields);
  }
}
