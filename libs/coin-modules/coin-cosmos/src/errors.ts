export class CosmosRedelegationInProgress extends Error {
  override name = "CosmosRedelegationInProgress";
}

export class CosmosDelegateAllFundsWarning extends Error {
  override name = "CosmosDelegateAllFundsWarning";
}

export class CosmosTooManyValidators extends Error {
  override name = "CosmosTooManyValidators";
}

export class NotEnoughDelegationBalance extends Error {
  override name = "NotEnoughDelegationBalance";
}

export class ClaimRewardsFeesWarning extends Error {
  override name = "ClaimRewardsFeesWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class CosmosTooManyRedelegations extends Error {
  override name = "CosmosTooManyRedelegations";
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
}

export class RecommendUndelegation extends Error {
  override name = "RecommendUndelegation";
}
