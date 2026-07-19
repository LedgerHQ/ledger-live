/*
 * When the recipient is a new account.
 */
export class NearNewAccountWarning extends Error {
  override name = "NearNewAccountWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NearNewAccountWarning");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * When the recipient is a new named account, and needs to be created first.
 */
export class NearNewNamedAccountError extends Error {
  override name = "NearNewNamedAccountError";
  constructor(message?: string) {
    super(message || "NearNewNamedAccountError");
  }
}

/*
 * When the recipient is a new account, and the amount doesn't cover the activation fee.
 */
export class NearActivationFeeNotCovered extends Error {
  override name = "NearActivationFeeNotCovered";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NearActivationFeeNotCovered");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * When the protocol config can not be loaded.
 */
export class NearProtocolConfigNotLoaded extends Error {
  override name = "NearProtocolConfigNotLoaded";
  constructor(message?: string) {
    super(message || "NearProtocolConfigNotLoaded");
  }
}

/*
 * When an entire account balance is being staked.
 */
export class NearUseAllAmountStakeWarning extends Error {
  override name = "NearUseAllAmountStakeWarning";
  constructor(message?: string) {
    super(message || "NearUseAllAmountStakeWarning");
  }
}

/*
 * When trying to unstake more than is staked.
 */
export class NearNotEnoughStaked extends Error {
  override name = "NearNotEnoughStaked";
  constructor(message?: string) {
    super(message || "NearNotEnoughStaked");
  }
}

/*
 * When trying to withdraw more than is available.
 */
export class NearNotEnoughAvailable extends Error {
  override name = "NearNotEnoughAvailable";
  constructor(message?: string) {
    super(message || "NearNotEnoughAvailable");
  }
}

/*
 * When sending max while there are existing staking positions.
 */
export class NearRecommendUnstake extends Error {
  override name = "NearRecommendUnstake";
  constructor(message?: string) {
    super(message || "NearRecommendUnstake");
  }
}

/*
 * When trying to stake, unstake, or withdraw less than the threshold.
 */
export class NearStakingThresholdNotMet extends Error {
  override name = "NearStakingThresholdNotMet";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "NearStakingThresholdNotMet");
    if (fields) Object.assign(this, fields);
  }
}
