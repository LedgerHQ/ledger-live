export class AleoAmountRecordRequired extends Error {
  override name = "AleoAmountRecordRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AleoAmountRecordRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class AleoFeeRecordRequired extends Error {
  override name = "AleoFeeRecordRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AleoFeeRecordRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class AleoTwoRecordsRequired extends Error {
  override name = "AleoTwoRecordsRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AleoTwoRecordsRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class AleoFeeRecordInsufficientBalance extends Error {
  override name = "AleoFeeRecordInsufficientBalance";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AleoFeeRecordInsufficientBalance");
    if (fields) Object.assign(this, fields);
  }
}

export class AleoApiConfigurationResetError extends Error {
  override name = "AleoApiConfigurationResetError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AleoApiConfigurationResetError");
    if (fields) Object.assign(this, fields);
  }
}

export class AleoInvalidArgumentsError extends Error {
  override name = "AleoInvalidArgumentsError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AleoInvalidArgumentsError");
    if (fields) Object.assign(this, fields);
  }
}

export class AleoProvableIdNotFoundError extends Error {
  override name = "AleoProvableIdNotFoundError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AleoProvableIdNotFoundError");
    if (fields) Object.assign(this, fields);
  }
}

export class AleoScannerUnavailableError extends Error {
  override name = "AleoScannerUnavailableError";
  /**
   * Advisory only: the coin-module framework has no retry convention, so consumers discriminate on
   * `name`. Kept as an explicit marker of which scanner failure is worth retrying.
   */
  readonly retryable = true;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AleoScannerUnavailableError");
    if (fields) Object.assign(this, fields);
  }
}

export class AleoTooManyRecordsSelected extends Error {
  override name = "AleoTooManyRecordsSelected";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AleoTooManyRecordsSelected");
    if (fields) Object.assign(this, fields);
  }
}

export class AleoAmountTooLargeForTransaction extends Error {
  override name = "AleoAmountTooLargeForTransaction";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "AleoAmountTooLargeForTransaction");
    if (fields) Object.assign(this, fields);
  }
}
