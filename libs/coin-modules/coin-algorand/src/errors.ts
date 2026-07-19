export class AlgorandASANotOptInInRecipient extends Error {
  override name = "AlgorandASANotOptInInRecipient";
  constructor(message?: string) {
    super(message ?? "AlgorandASANotOptInInRecipient");
  }
}

export class AlgorandMemoExceededSizeError extends Error {
  override name = "AlgorandMemoExceededSizeError";
  constructor(message?: string) {
    super(message ?? "AlgorandMemoExceededSizeError");
  }
}

export class ClaimRewardsFeesWarning extends Error {
  override name = "ClaimRewardsFeesWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ClaimRewardsFeesWarning");
    if (fields) Object.assign(this, fields);
  }
}
