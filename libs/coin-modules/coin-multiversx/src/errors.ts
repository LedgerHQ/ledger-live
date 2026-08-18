export class MultiversXDecimalsLimitReached extends Error {
  override name = "MultiversXDecimalsLimitReached";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "MultiversXDecimalsLimitReached");
    if (fields) Object.assign(this, fields);
  }
}

export class MultiversXMinDelegatedAmountError extends Error {
  override name = "MultiversXMinDelegatedAmountError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "MultiversXMinDelegatedAmountError");
    if (fields) Object.assign(this, fields);
  }
}

export class MultiversXMinUndelegatedAmountError extends Error {
  override name = "MultiversXMinUndelegatedAmountError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "MultiversXMinUndelegatedAmountError");
    if (fields) Object.assign(this, fields);
  }
}

export class MultiversXDelegationBelowMinimumError extends Error {
  override name = "MultiversXDelegationBelowMinimumError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "MultiversXDelegationBelowMinimumError");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughEGLDForFees extends Error {
  override name = "NotEnoughEGLDForFees";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughEGLDForFees");
    if (fields) Object.assign(this, fields);
  }
}
