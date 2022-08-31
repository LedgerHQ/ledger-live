import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * When the recipient is a new account.
 */
export const NearNewAccountWarning = createCustomErrorClass(
  "NearNewAccountWarning"
);

/*
 * When the recipient is a new named account, and needs to be created first.
 */
export const NearNewNamedAccountError = createCustomErrorClass(
  "NearNewNamedAccountError"
);

/*
 * When the recipient is a new account, and the amount doesn't cover the activation fee.
 */
export const NearActivationFeeNotCovered = createCustomErrorClass(
  "NearActivationFeeNotCovered"
);

/*
 * When the protocol config can not be loaded.
 */
export const NearProtocolConfigNotLoaded = createCustomErrorClass(
  "NearProtocolConfigNotLoaded"
);

/*
 * When an entire account balance is being staked.
 */
export const NearUseAllAmountStakeWarning = createCustomErrorClass(
  "NearUseAllAmountStakeWarning"
);

/*
 * When trying to unstake more than is staked.
 */
export const NearNotEnoughStaked = createCustomErrorClass(
  "NearNotEnoughStaked"
);

/*
 * When trying to withdraw more than is available.
 */
export const NearNotEnoughAvailable = createCustomErrorClass(
  "NearNotEnoughAvailable"
);

/*
 * When sending max while there are existing staking positions.
 */
export const NearRecommendUnstake = createCustomErrorClass(
  "NearRecommendUnstake"
);

/*
 * When trying to stake, unstake, or withdraw less than the threshold.
 */
export const NearStakingThresholdNotMet = createCustomErrorClass(
  "NearStakingThresholdNotMet"
);
