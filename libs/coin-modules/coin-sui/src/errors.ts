import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * One SUI is minimal to stake.
 */
export const OneSuiMinForStake = createCustomErrorClass("OneSuiMinForStake");

/*
 * One SUI is minimal for partial unstake.
 */
export const OneSuiMinForUnstake = createCustomErrorClass("OneSuiMinForUnstake");

/*
 * One SUI is minimal to be left when partial unstake.
 */
export const OneSuiMinForUnstakeToBeLeft = createCustomErrorClass("OneSuiMinForUnstakeToBeLeft");

/*
 * At least 0.1 SUI to unstake
 */
export const SomeSuiForUnstake = createCustomErrorClass("SomeSuiForUnstake");
