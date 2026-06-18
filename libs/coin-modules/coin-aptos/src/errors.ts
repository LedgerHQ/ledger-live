export class SequenceNumberTooOldError extends Error {
  override name = "SequenceNumberTooOld";
  constructor(message = "SequenceNumberTooOld") {
    super(message);
  }
}

export class SequenceNumberTooNewError extends Error {
  override name = "SequenceNumberTooNew";
  constructor(message = "SequenceNumberTooNew") {
    super(message);
  }
}

export class TransactionExpiredError extends Error {
  override name = "TransactionExpired";
  constructor(message = "TransactionExpired") {
    super(message);
  }
}
