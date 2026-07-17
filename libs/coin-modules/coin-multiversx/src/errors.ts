export class MultiversXDecimalsLimitReached extends Error {
  override name = "MultiversXDecimalsLimitReached";
}

export class MultiversXMinDelegatedAmountError extends Error {
  override name = "MultiversXMinDelegatedAmountError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class MultiversXMinUndelegatedAmountError extends Error {
  override name = "MultiversXMinUndelegatedAmountError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class MultiversXDelegationBelowMinimumError extends Error {
  override name = "MultiversXDelegationBelowMinimumError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughEGLDForFees extends Error {
  override name = "NotEnoughEGLDForFees";
}
