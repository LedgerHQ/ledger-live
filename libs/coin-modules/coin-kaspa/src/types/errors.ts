export class NotEnoughFeeError extends Error {
  override name = "NotEnoughFeeError";
  constructor(message = "NotEnoughFeeError") {
    super(message);
  }
}
export class TransactionMassExceededError extends Error {
  override name = "TransactionMassExceededError";
  constructor(message = "TransactionMassExceededError") {
    super(message);
  }
}
export class EmptyRecipientError extends Error {
  override name = "EmptyRecipientError";
  constructor(message = "EmptyRecipientError") {
    super(message);
  }
}
export class ReducedAmountUtxoWarning extends Error {
  override name = "ReducedAmountUtxoWarning";
  constructor(message = "ReducedAmountUtxoWarning") {
    super(message);
  }
}
export class UtxoLimitReachedError extends Error {
  override name = "UtxoLimitReachedError";
  constructor(message = "UtxoLimitReachedError") {
    super(message);
  }
}
