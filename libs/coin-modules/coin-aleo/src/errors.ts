export class AleoAmountRecordRequired extends Error {
  override name = "AleoAmountRecordRequired";
}
export class AleoFeeRecordRequired extends Error {
  override name = "AleoFeeRecordRequired";
}
export class AleoTwoRecordsRequired extends Error {
  override name = "AleoTwoRecordsRequired";
}
export class AleoFeeRecordInsufficientBalance extends Error {
  override name = "AleoFeeRecordInsufficientBalance";
}
export class AleoApiConfigurationResetError extends Error {
  override name = "AleoApiConfigurationResetError";
}
export class AleoTooManyRecordsSelected extends Error {
  override name = "AleoTooManyRecordsSelected";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
export class AleoAmountTooLargeForTransaction extends Error {
  override name = "AleoAmountTooLargeForTransaction";
}

export class LedgerAPI4xx extends Error {
  override name = "LedgerAPI4xx";
  status?: number;
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
