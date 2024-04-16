import { createCustomErrorClass } from "@ledgerhq/errors";
export const PolkadotUnauthorizedOperation = createCustomErrorClass(
  "PolkadotUnauthorizedOperation",
);
export const PolkadotElectionClosed = createCustomErrorClass("PolkadotElectionClosed");
export const PolkadotNotValidator = createCustomErrorClass("PolkadotNotValidator");
export const PolkadotLowBondedBalance = createCustomErrorClass("PolkadotLowBondedBalance");
export const PolkadotNoUnlockedBalance = createCustomErrorClass("PolkadotNoUnlockedBalance");
export const PolkadotNoNominations = createCustomErrorClass("PolkadotNoNominations");
export const PolkadotAllFundsWarning = createCustomErrorClass("PolkadotAllFundsWarning");
export const PolkadotBondMinimumAmount = createCustomErrorClass("PolkadotBondMinimumAmount");

export const PolkadotBondMinimumAmountWarning = createCustomErrorClass(
  "PolkadotBondMinimumAmountWarning",
);

export const PolkadotMaxUnbonding = createCustomErrorClass("PolkadotMaxUnbonding");
export const PolkadotValidatorsRequired = createCustomErrorClass("PolkadotValidatorsRequired");
export const PolkadotDoMaxSendInstead = createCustomErrorClass("PolkadotDoMaxSendInstead");
