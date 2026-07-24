export class CosmosRedelegationInProgress extends Error {
  override name = "CosmosRedelegationInProgress";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CosmosRedelegationInProgress");
    if (fields) Object.assign(this, fields);
  }
}

export class CosmosDelegateAllFundsWarning extends Error {
  override name = "CosmosDelegateAllFundsWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CosmosDelegateAllFundsWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class CosmosTooManyValidators extends Error {
  override name = "CosmosTooManyValidators";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CosmosTooManyValidators");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughDelegationBalance extends Error {
  override name = "NotEnoughDelegationBalance";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughDelegationBalance");
    if (fields) Object.assign(this, fields);
  }
}

export class ClaimRewardsFeesWarning extends Error {
  override name = "ClaimRewardsFeesWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ClaimRewardsFeesWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class CosmosTooManyRedelegations extends Error {
  override name = "CosmosTooManyRedelegations";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CosmosTooManyRedelegations");
    if (fields) Object.assign(this, fields);
  }
}
