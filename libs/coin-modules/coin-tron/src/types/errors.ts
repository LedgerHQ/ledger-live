export class TronNoFrozenForBandwidth extends Error {
  override name = "TronNoFrozenForBandwidth";
}

export class TronNoFrozenForEnergy extends Error {
  override name = "TronNoFrozenForEnergy";
}

export class TronUnfreezeNotExpired extends Error {
  override name = "TronUnfreezeNotExpired";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class TronLegacyUnfreezeNotExpired extends Error {
  override name = "TronLegacyUnfreezeNotExpired";
}

export class TronVoteRequired extends Error {
  override name = "TronVoteRequired";
}

export class TronInvalidVoteCount extends Error {
  override name = "TronInvalidVoteCount";
}

export class TronRewardNotAvailable extends Error {
  override name = "TronRewardNotAvailable";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class TronNoReward extends Error {
  override name = "TronNoReward";
}

export class TronInvalidFreezeAmount extends Error {
  override name = "TronInvalidFreezeAmount";
}

export class TronSendTrc20ToNewAccountForbidden extends Error {
  override name = "TronSendTrc20ToNewAccountForbidden";
}

export class TronUnexpectedFees extends Error {
  override name = "TronUnexpectedFees";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class TronNotEnoughTronPower extends Error {
  override name = "TronNotEnoughTronPower";
}

export class TronTransactionExpired extends Error {
  override name = "TronTransactionExpired";
}

export class TronNotEnoughEnergy extends Error {
  override name = "TronNotEnoughEnergy";
}

export class TronNoUnfrozenResource extends Error {
  override name = "TronNoUnfrozenResource";
}

export class TronInvalidUnDelegateResourceAmount extends Error {
  override name = "TronInvalidUnDelegateResourceAmount";
}

export class TronEmptyPage extends Error {
  override name = "TronEmptyPage";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

export class TronEmptyAccount extends Error {
  override name = "TronEmptyAccount";
}

export class MaybeKeepTronAccountAlive extends Error {
  override name = "MaybeKeepTronAccountAlive";
}

export class NotEnoughGas extends Error {
  override name = "NotEnoughGas";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
