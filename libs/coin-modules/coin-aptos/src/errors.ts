export class SequenceNumberTooOldError extends Error {
  override name = "SequenceNumberTooOld";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SequenceNumberTooOld");
    if (fields) Object.assign(this, fields);
  }
}

export class SequenceNumberTooNewError extends Error {
  override name = "SequenceNumberTooNew";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SequenceNumberTooNew");
    if (fields) Object.assign(this, fields);
  }
}

export class TransactionExpiredError extends Error {
  override name = "TransactionExpired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TransactionExpired");
    if (fields) Object.assign(this, fields);
  }
}
