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
