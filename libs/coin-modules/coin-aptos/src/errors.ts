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

export class NotEnoughToStake extends Error {
  override name = "NotEnoughToStake";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughToStake");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughToUnstake extends Error {
  override name = "NotEnoughToUnstake";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughToUnstake");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughToRestake extends Error {
  override name = "NotEnoughToRestake";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughToRestake");
    if (fields) Object.assign(this, fields);
  }
}

export class UnstakeNotEnoughStakedBalanceLeft extends Error {
  override name = "UnstakeNotEnoughStakedBalanceLeft";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "UnstakeNotEnoughStakedBalanceLeft");
    if (fields) Object.assign(this, fields);
  }
}

export class RestakeNotEnoughStakedBalanceLeft extends Error {
  override name = "RestakeNotEnoughStakedBalanceLeft";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "RestakeNotEnoughStakedBalanceLeft");
    if (fields) Object.assign(this, fields);
  }
}
