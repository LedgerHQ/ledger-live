export class MultiversXDecimalsLimitReached extends Error {
  override name = "MultiversXDecimalsLimitReached";
  constructor(message = "MultiversXDecimalsLimitReached") {
    super(message);
  }
}

export class MultiversXMinDelegatedAmountError extends Error {
  override name = "MultiversXMinDelegatedAmountError";
  constructor(message = "MultiversXMinDelegatedAmountError", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class MultiversXMinUndelegatedAmountError extends Error {
  override name = "MultiversXMinUndelegatedAmountError";
  constructor(message = "MultiversXMinUndelegatedAmountError", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class MultiversXDelegationBelowMinimumError extends Error {
  override name = "MultiversXDelegationBelowMinimumError";
  constructor(message = "MultiversXDelegationBelowMinimumError", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughEGLDForFees extends Error {
  override name = "NotEnoughEGLDForFees";
  constructor(message = "NotEnoughEGLDForFees") {
    super(message);
  }
}
