import { createCustomErrorClass } from "@ledgerhq/errors";

/**
 * Icon error thrown on a specifc check done on a transaction amount
 */
export const IconSpecificError = createCustomErrorClass("IconSpecificError");
export const IconVoteRequired = createCustomErrorClass("IconVoteRequired");
export const IconNotEnoughVotingPower = createCustomErrorClass(
  "IconNotEnoughVotingPower"
);