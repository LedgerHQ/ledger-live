export class CosmosRedelegationInProgress extends Error {
  override name = "CosmosRedelegationInProgress";
  constructor(message?: string) {
    super(message ?? "CosmosRedelegationInProgress");
  }
}

export class CosmosDelegateAllFundsWarning extends Error {
  override name = "CosmosDelegateAllFundsWarning";
  constructor(message?: string) {
    super(message ?? "CosmosDelegateAllFundsWarning");
  }
}

export class CosmosTooManyValidators extends Error {
  override name = "CosmosTooManyValidators";
  constructor(message?: string) {
    super(message ?? "CosmosTooManyValidators");
  }
}

export class NotEnoughDelegationBalance extends Error {
  override name = "NotEnoughDelegationBalance";
  constructor(message?: string) {
    super(message ?? "NotEnoughDelegationBalance");
  }
}

export class ClaimRewardsFeesWarning extends Error {
  override name = "ClaimRewardsFeesWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "ClaimRewardsFeesWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class CosmosTooManyRedelegations extends Error {
  override name = "CosmosTooManyRedelegations";
  constructor(message?: string) {
    super(message ?? "CosmosTooManyRedelegations");
  }
}

export class SequenceNumberError extends Error {
  override name = "SequenceNumberError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message ?? "SequenceNumberError");
    if (fields) Object.assign(this, fields);
  }
}

export class ExpertModeRequired extends Error {
  override name = "ExpertModeRequired";
  constructor(message?: string) {
    super(message ?? "ExpertModeRequired");
  }
}

export class RecommendUndelegation extends Error {
  override name = "RecommendUndelegation";
  constructor(message?: string) {
    super(message ?? "RecommendUndelegation");
  }
}
