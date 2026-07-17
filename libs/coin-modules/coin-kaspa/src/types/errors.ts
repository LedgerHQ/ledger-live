export class NotEnoughFeeError extends Error {
  override name = "NotEnoughFeeError";
}
export class TransactionMassExceededError extends Error {
  override name = "TransactionMassExceededError";
}
export class EmptyRecipientError extends Error {
  override name = "EmptyRecipientError";
}
export class ReducedAmountUtxoWarning extends Error {
  override name = "ReducedAmountUtxoWarning";
}
export class UtxoLimitReachedError extends Error {
  override name = "UtxoLimitReachedError";
}
