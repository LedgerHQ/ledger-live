export class AleoAmountRecordRequired extends Error {
  override name = "AleoAmountRecordRequired";
  constructor(message?: string) {
    super(message ?? "AleoAmountRecordRequired");
  }
}
export class AleoFeeRecordRequired extends Error {
  override name = "AleoFeeRecordRequired";
  constructor(message?: string) {
    super(message ?? "AleoFeeRecordRequired");
  }
}
export class AleoTwoRecordsRequired extends Error {
  override name = "AleoTwoRecordsRequired";
  constructor(message?: string) {
    super(message ?? "AleoTwoRecordsRequired");
  }
}
export class AleoFeeRecordInsufficientBalance extends Error {
  override name = "AleoFeeRecordInsufficientBalance";
  constructor(message?: string) {
    super(message ?? "AleoFeeRecordInsufficientBalance");
  }
}
export class AleoApiConfigurationResetError extends Error {
  override name = "AleoApiConfigurationResetError";
  constructor(message?: string) {
    super(message ?? "AleoApiConfigurationResetError");
  }
}
export class AleoTooManyRecordsSelected extends Error {
  override name = "AleoTooManyRecordsSelected";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "AleoTooManyRecordsSelected");
    if (fields) Object.assign(this, fields);
  }
}
export class AleoAmountTooLargeForTransaction extends Error {
  override name = "AleoAmountTooLargeForTransaction";
  constructor(message?: string) {
    super(message ?? "AleoAmountTooLargeForTransaction");
  }
}

export class LedgerAPI4xx extends Error {
  override name = "LedgerAPI4xx";
  status?: number;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "LedgerAPI4xx");
    if (fields) Object.assign(this, fields);
  }
}
