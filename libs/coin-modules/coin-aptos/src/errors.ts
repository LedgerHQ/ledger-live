export class SequenceNumberTooOldError extends Error {
  override name = "SequenceNumberTooOld";
}

export class SequenceNumberTooNewError extends Error {
  override name = "SequenceNumberTooNew";
}

export class TransactionExpiredError extends Error {
  override name = "TransactionExpired";
}

export class NotEnoughToStake extends Error {
  override name = "NotEnoughToStake";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughToUnstake extends Error {
  override name = "NotEnoughToUnstake";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughToRestake extends Error {
  override name = "NotEnoughToRestake";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class UnstakeNotEnoughStakedBalanceLeft extends Error {
  override name = "UnstakeNotEnoughStakedBalanceLeft";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class RestakeNotEnoughStakedBalanceLeft extends Error {
  override name = "RestakeNotEnoughStakedBalanceLeft";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
