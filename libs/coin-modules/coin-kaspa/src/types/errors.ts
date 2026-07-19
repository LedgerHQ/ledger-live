export class NotEnoughFeeError extends Error {
  override name = "NotEnoughFeeError";
  constructor(message?: string) {
    super(message ?? "NotEnoughFeeError");
  }
}
export class TransactionMassExceededError extends Error {
  override name = "TransactionMassExceededError";
  constructor(message?: string) {
    super(message ?? "TransactionMassExceededError");
  }
}
export class EmptyRecipientError extends Error {
  override name = "EmptyRecipientError";
  constructor(message?: string) {
    super(message ?? "EmptyRecipientError");
  }
}
export class ReducedAmountUtxoWarning extends Error {
  override name = "ReducedAmountUtxoWarning";
  constructor(message?: string) {
    super(message ?? "ReducedAmountUtxoWarning");
  }
}
export class UtxoLimitReachedError extends Error {
  override name = "UtxoLimitReachedError";
  constructor(message?: string) {
    super(message ?? "UtxoLimitReachedError");
  }
}
