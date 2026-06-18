/*
 * When the recipient is a new account.
 */
export class NearNewAccountWarning extends Error {
  override name = "NearNewAccountWarning";
  constructor(message = "NearNewAccountWarning", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

/*
 * When the recipient is a new named account, and needs to be created first.
 */
export class NearNewNamedAccountError extends Error {
  override name = "NearNewNamedAccountError";
  constructor(message = "NearNewNamedAccountError") {
    super(message);
  }
}

/*
 * When the recipient is a new account, and the amount doesn't cover the activation fee.
 */
export class NearActivationFeeNotCovered extends Error {
  override name = "NearActivationFeeNotCovered";
  constructor(message = "NearActivationFeeNotCovered", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}

/*
 * When the protocol config can not be loaded.
 */
export class NearProtocolConfigNotLoaded extends Error {
  override name = "NearProtocolConfigNotLoaded";
  constructor(message = "NearProtocolConfigNotLoaded") {
    super(message);
  }
}

/*
 * When an entire account balance is being staked.
 */
export class NearUseAllAmountStakeWarning extends Error {
  override name = "NearUseAllAmountStakeWarning";
  constructor(message = "NearUseAllAmountStakeWarning") {
    super(message);
  }
}

/*
 * When trying to unstake more than is staked.
 */
export class NearNotEnoughStaked extends Error {
  override name = "NearNotEnoughStaked";
  constructor(message = "NearNotEnoughStaked") {
    super(message);
  }
}

/*
 * When trying to withdraw more than is available.
 */
export class NearNotEnoughAvailable extends Error {
  override name = "NearNotEnoughAvailable";
  constructor(message = "NearNotEnoughAvailable") {
    super(message);
  }
}

/*
 * When sending max while there are existing staking positions.
 */
export class NearRecommendUnstake extends Error {
  override name = "NearRecommendUnstake";
  constructor(message = "NearRecommendUnstake") {
    super(message);
  }
}

/*
 * When trying to stake, unstake, or withdraw less than the threshold.
 */
export class NearStakingThresholdNotMet extends Error {
  override name = "NearStakingThresholdNotMet";
  constructor(message = "NearStakingThresholdNotMet", fields?: Record<string, unknown>) {
    super(message);
    if (fields) Object.assign(this, fields);
  }
}
