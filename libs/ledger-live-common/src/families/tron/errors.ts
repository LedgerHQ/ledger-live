import { createCustomErrorClass } from "@ledgerhq/errors";

export const TronNoFrozenForBandwidth = createCustomErrorClass("TronNoFrozenForBandwidth");
export const TronNoFrozenForEnergy = createCustomErrorClass("TronNoFrozenForEnergy");
export const TronUnfreezeNotExpired = createCustomErrorClass("TronUnfreezeNotExpired");
export const TronLegacyUnfreezeNotExpired = createCustomErrorClass("TronLegacyUnfreezeNotExpired");
export const TronVoteRequired = createCustomErrorClass("TronVoteRequired");
export const TronInvalidVoteCount = createCustomErrorClass("TronInvalidVoteCount");
export const TronRewardNotAvailable = createCustomErrorClass("TronRewardNotAvailable");
export const TronNoReward = createCustomErrorClass("TronNoReward");
export const TronInvalidFreezeAmount = createCustomErrorClass("TronInvalidFreezeAmount");
export const TronSendTrc20ToNewAccountForbidden = createCustomErrorClass(
  "TronSendTrc20ToNewAccountForbidden",
);
export const TronUnexpectedFees = createCustomErrorClass("TronUnexpectedFees");
export const TronNotEnoughTronPower = createCustomErrorClass("TronNotEnoughTronPower");
export const TronTransactionExpired = createCustomErrorClass("TronTransactionExpired");
export const TronNotEnoughEnergy = createCustomErrorClass("TronNotEnoughEnergy");
export const TronNoUnfrozenResource = createCustomErrorClass("TronNoUnfrozenResource");
export const TronInvalidUnDelegateResourceAmount = createCustomErrorClass(
  "TronInvalidUnDelegateResourceAmount",
);
