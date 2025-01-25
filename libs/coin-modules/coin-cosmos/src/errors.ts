import { createCustomErrorClass } from "@ledgerhq/errors";

export const CosmosRedelegationInProgress = createCustomErrorClass("CosmosRedelegationInProgress");
export const CosmosDelegateAllFundsWarning = createCustomErrorClass(
  "CosmosDelegateAllFundsWarning",
);
export const CosmosTooManyValidators = createCustomErrorClass("CosmosTooManyValidators");
export const NotEnoughDelegationBalance = createCustomErrorClass("NotEnoughDelegationBalance");
export const ClaimRewardsFeesWarning = createCustomErrorClass("ClaimRewardsFeesWarning");
