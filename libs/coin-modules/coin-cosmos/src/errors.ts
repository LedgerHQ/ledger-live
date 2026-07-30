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

export class SequenceNumberError extends Error {
  override name = "SequenceNumberError";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "SequenceNumberError");
    if (fields) Object.assign(this, fields);
  }
}

export class ExpertModeRequired extends Error {
  override name = "ExpertModeRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ExpertModeRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class RecommendUndelegation extends Error {
  override name = "RecommendUndelegation";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "RecommendUndelegation");
    if (fields) Object.assign(this, fields);
  }
}

export class ValAddressRequired extends Error {
  override name = "ValAddressRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "ValAddressRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class RedelegateDstValAddressRequired extends Error {
  override name = "RedelegateDstValAddressRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "RedelegateDstValAddressRequired");
    if (fields) Object.assign(this, fields);
  }
}
