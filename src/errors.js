// @flow
import { createCustomErrorClass } from "@ledgerhq/errors";

// TODO we need to migrate in all errors that are in @ledgerhq/errors
// but only make sense to live-common to not pollute ledgerjs

export const TransactionRefusedOnDevice = createCustomErrorClass(
  "TransactionRefusedOnDevice"
);

export const ResourceNotSupported = createCustomErrorClass(
  "ResourceNotSupported"
);

export const NoFrozenForBandwidth = createCustomErrorClass(
  "NoFrozenForBandwidth"
);

export const NoFrozenForEnergy = createCustomErrorClass("NoFrozenForEnergy");
export const UnfreezeNotExpired = createCustomErrorClass("UnfreezeNotExpired");

export const VoteRequired = createCustomErrorClass("VoteRequired");

export const InvalidVoteCount = createCustomErrorClass("InvalidVoteCount");

export const RewardNotAvailable = createCustomErrorClass("RewardNotAvailable");

export const NoReward = createCustomErrorClass("NoReward");

export const InvalidFreezeAmount = createCustomErrorClass(
  "InvalidFreezeAmount"
);

export const SendTrc20ToNewAccountForbidden = createCustomErrorClass(
  "SendTrc20ToNewAccountForbidden"
);

export const UnexpectedFees = createCustomErrorClass("UnexpectedFees");

export const NotEnoughTronPower = createCustomErrorClass("NotEnoughTronPower");
