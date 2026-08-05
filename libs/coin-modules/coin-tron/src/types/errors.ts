export class TronNoFrozenForBandwidth extends Error {
  override name = "TronNoFrozenForBandwidth";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronNoFrozenForBandwidth");
    if (fields) Object.assign(this, fields);
  }
}

export class TronNoFrozenForEnergy extends Error {
  override name = "TronNoFrozenForEnergy";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronNoFrozenForEnergy");
    if (fields) Object.assign(this, fields);
  }
}

export class TronUnfreezeNotExpired extends Error {
  override name = "TronUnfreezeNotExpired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronUnfreezeNotExpired");
    if (fields) Object.assign(this, fields);
  }
}

export class TronLegacyUnfreezeNotExpired extends Error {
  override name = "TronLegacyUnfreezeNotExpired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronLegacyUnfreezeNotExpired");
    if (fields) Object.assign(this, fields);
  }
}

export class TronVoteRequired extends Error {
  override name = "TronVoteRequired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronVoteRequired");
    if (fields) Object.assign(this, fields);
  }
}

export class TronInvalidVoteCount extends Error {
  override name = "TronInvalidVoteCount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronInvalidVoteCount");
    if (fields) Object.assign(this, fields);
  }
}

export class TronRewardNotAvailable extends Error {
  override name = "TronRewardNotAvailable";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronRewardNotAvailable");
    if (fields) Object.assign(this, fields);
  }
}

export class TronNoReward extends Error {
  override name = "TronNoReward";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronNoReward");
    if (fields) Object.assign(this, fields);
  }
}

export class TronInvalidFreezeAmount extends Error {
  override name = "TronInvalidFreezeAmount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronInvalidFreezeAmount");
    if (fields) Object.assign(this, fields);
  }
}

export class TronSendTrc20ToNewAccountForbidden extends Error {
  override name = "TronSendTrc20ToNewAccountForbidden";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronSendTrc20ToNewAccountForbidden");
    if (fields) Object.assign(this, fields);
  }
}

export class TronUnexpectedFees extends Error {
  override name = "TronUnexpectedFees";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronUnexpectedFees");
    if (fields) Object.assign(this, fields);
  }
}

export class TronNotEnoughTronPower extends Error {
  override name = "TronNotEnoughTronPower";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronNotEnoughTronPower");
    if (fields) Object.assign(this, fields);
  }
}

export class TronTransactionExpired extends Error {
  override name = "TronTransactionExpired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronTransactionExpired");
    if (fields) Object.assign(this, fields);
  }
}

export class TronNotEnoughEnergy extends Error {
  override name = "TronNotEnoughEnergy";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronNotEnoughEnergy");
    if (fields) Object.assign(this, fields);
  }
}

export class TronNoUnfrozenResource extends Error {
  override name = "TronNoUnfrozenResource";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronNoUnfrozenResource");
    if (fields) Object.assign(this, fields);
  }
}

export class TronInvalidUnDelegateResourceAmount extends Error {
  override name = "TronInvalidUnDelegateResourceAmount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronInvalidUnDelegateResourceAmount");
    if (fields) Object.assign(this, fields);
  }
}

export class TronEmptyPage extends Error {
  override name = "TronEmptyPage";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronEmptyPage");
    if (fields) Object.assign(this, fields);
  }
}

export class TronEmptyAccount extends Error {
  override name = "TronEmptyAccount";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "TronEmptyAccount");
    if (fields) Object.assign(this, fields);
  }
}

export class MaybeKeepTronAccountAlive extends Error {
  override name = "MaybeKeepTronAccountAlive";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "MaybeKeepTronAccountAlive");
    if (fields) Object.assign(this, fields);
  }
}

export class NotEnoughGas extends Error {
  override name = "NotEnoughGas";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NotEnoughGas");
    if (fields) Object.assign(this, fields);
  }
}
