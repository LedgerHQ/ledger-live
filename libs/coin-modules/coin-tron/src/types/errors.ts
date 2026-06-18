export class TronNoFrozenForBandwidth extends Error {
  override name = "TronNoFrozenForBandwidth";
  constructor(message = "TronNoFrozenForBandwidth") {
    super(message);
  }
}
export class TronNoFrozenForEnergy extends Error {
  override name = "TronNoFrozenForEnergy";
  constructor(message = "TronNoFrozenForEnergy") {
    super(message);
  }
}
export class TronUnfreezeNotExpired extends Error {
  override name = "TronUnfreezeNotExpired";
  declare time: string;
  constructor(message = "TronUnfreezeNotExpired", fields?: { time: string }) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
export class TronLegacyUnfreezeNotExpired extends Error {
  override name = "TronLegacyUnfreezeNotExpired";
  constructor(message = "TronLegacyUnfreezeNotExpired") {
    super(message);
  }
}
export class TronVoteRequired extends Error {
  override name = "TronVoteRequired";
  constructor(message = "TronVoteRequired") {
    super(message);
  }
}
export class TronInvalidVoteCount extends Error {
  override name = "TronInvalidVoteCount";
  constructor(message = "TronInvalidVoteCount") {
    super(message);
  }
}
export class TronRewardNotAvailable extends Error {
  override name = "TronRewardNotAvailable";
  declare until: string;
  constructor(message = "TronRewardNotAvailable", fields?: { until: string }) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
export class TronNoReward extends Error {
  override name = "TronNoReward";
  constructor(message = "TronNoReward") {
    super(message);
  }
}
export class TronInvalidFreezeAmount extends Error {
  override name = "TronInvalidFreezeAmount";
  constructor(message = "TronInvalidFreezeAmount") {
    super(message);
  }
}
export class TronSendTrc20ToNewAccountForbidden extends Error {
  override name = "TronSendTrc20ToNewAccountForbidden";
  constructor(message = "TronSendTrc20ToNewAccountForbidden") {
    super(message);
  }
}
export class TronUnexpectedFees extends Error {
  override name = "TronUnexpectedFees";
  declare fees: string;
  constructor(message = "TronUnexpectedFees", fields?: { fees: string }) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
export class TronNotEnoughTronPower extends Error {
  override name = "TronNotEnoughTronPower";
  constructor(message = "TronNotEnoughTronPower") {
    super(message);
  }
}
export class TronTransactionExpired extends Error {
  override name = "TronTransactionExpired";
  constructor(message = "TronTransactionExpired") {
    super(message);
  }
}
export class TronNotEnoughEnergy extends Error {
  override name = "TronNotEnoughEnergy";
  constructor(message = "TronNotEnoughEnergy") {
    super(message);
  }
}
export class TronNoUnfrozenResource extends Error {
  override name = "TronNoUnfrozenResource";
  constructor(message = "TronNoUnfrozenResource") {
    super(message);
  }
}
export class TronInvalidUnDelegateResourceAmount extends Error {
  override name = "TronInvalidUnDelegateResourceAmount";
  constructor(message = "TronInvalidUnDelegateResourceAmount") {
    super(message);
  }
}
export class TronEmptyPage extends Error {
  override name = "TronEmptyPage";
  constructor(message = "TronEmptyPage") {
    super(message);
  }
}
