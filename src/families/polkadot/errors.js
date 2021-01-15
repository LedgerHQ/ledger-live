// @flow
import { createCustomErrorClass } from "@ledgerhq/errors";

export const PolkadotUnauthorizedOperation = createCustomErrorClass(
  "PolkadotUnauthorizedOperation"
);

export const PolkadotElectionClosed = createCustomErrorClass(
  "PolkadotElectionClosed"
);

export const PolkadotNotValidator = createCustomErrorClass(
  "PolkadotNotValidator"
);

export const PolkadotLowBondedBalance = createCustomErrorClass(
  "PolkadotLowBondedBalance"
);

export const PolkadotNoUnlockedBalance = createCustomErrorClass(
  "PolkadotNoUnlockedBalance"
);

export const PolkadotNoNominations = createCustomErrorClass(
  "PolkadotNoNominations"
);

export const PolkadotBondAllFundsWarning = createCustomErrorClass(
  "PolkadotBondAllFundsWarning"
);

export const PolkadotBondMinimumAmount = createCustomErrorClass(
  "PolkadotBondMinimumAmount"
);

export const PolkadotMaxUnbonding = createCustomErrorClass(
  "PolkadotMaxUnbonding"
);

export const PolkadotValidatorsRequired = createCustomErrorClass(
  "PolkadotValidatorsRequired"
);
