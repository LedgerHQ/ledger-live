// @flow
import { createCustomErrorClass } from "@ledgerhq/errors";

// TODO we need to migrate in all errors that are in @ledgerhq/errors
// but only make sense to live-common to not pollute ledgerjs

export const TransactionRefusedOnDevice = createCustomErrorClass(
  "TransactionRefusedOnDevice"
);

export const TronNoFrozenForBandwidth = createCustomErrorClass(
  "TronNoFrozenForBandwidth"
);

export const TronNoFrozenForEnergy = createCustomErrorClass(
  "TronNoFrozenForEnergy"
);
export const TronUnfreezeNotExpired = createCustomErrorClass(
  "TronUnfreezeNotExpired"
);

export const TronVoteRequired = createCustomErrorClass("TronVoteRequired");

export const TronInvalidVoteCount = createCustomErrorClass(
  "TronInvalidVoteCount"
);

export const TronRewardNotAvailable = createCustomErrorClass(
  "TronRewardNotAvailable"
);

export const TronNoReward = createCustomErrorClass("TronNoReward");

export const TronInvalidFreezeAmount = createCustomErrorClass(
  "TronInvalidFreezeAmount"
);

export const TronSendTrc20ToNewAccountForbidden = createCustomErrorClass(
  "TronSendTrc20ToNewAccountForbidden"
);

export const TronUnexpectedFees = createCustomErrorClass("TronUnexpectedFees");

export const TronNotEnoughTronPower = createCustomErrorClass(
  "TronNotEnoughTronPower"
);

export const TronTransactionExpired = createCustomErrorClass(
  "TronTransactionExpired"
);
