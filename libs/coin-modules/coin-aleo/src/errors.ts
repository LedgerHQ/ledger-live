export class AleoAmountRecordRequired extends Error {
  override name = "AleoAmountRecordRequired";
  constructor(message = "AleoAmountRecordRequired") {
    super(message);
  }
}

export class AleoFeeRecordRequired extends Error {
  override name = "AleoFeeRecordRequired";
  constructor(message = "AleoFeeRecordRequired") {
    super(message);
  }
}

export class AleoTwoRecordsRequired extends Error {
  override name = "AleoTwoRecordsRequired";
  constructor(message = "AleoTwoRecordsRequired") {
    super(message);
  }
}

export class AleoFeeRecordInsufficientBalance extends Error {
  override name = "AleoFeeRecordInsufficientBalance";
  constructor(message = "AleoFeeRecordInsufficientBalance") {
    super(message);
  }
}

export class AleoApiConfigurationResetError extends Error {
  override name = "AleoApiConfigurationResetError";
  constructor(message = "AleoApiConfigurationResetError") {
    super(message);
  }
}

export class AleoTooManyRecordsSelected extends Error {
  override name = "AleoTooManyRecordsSelected";
  constructor(message = "AleoTooManyRecordsSelected", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class AleoAmountTooLargeForTransaction extends Error {
  override name = "AleoAmountTooLargeForTransaction";
  constructor(message = "AleoAmountTooLargeForTransaction") {
    super(message);
  }
}
