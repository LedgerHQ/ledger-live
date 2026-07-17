export class AlgorandASANotOptInInRecipient extends Error {
  override name = "AlgorandASANotOptInInRecipient";
}

export class AlgorandMemoExceededSizeError extends Error {
  override name = "AlgorandMemoExceededSizeError";
}

export class ClaimRewardsFeesWarning extends Error {
  override name = "ClaimRewardsFeesWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
