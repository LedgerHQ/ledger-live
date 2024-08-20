import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * When the transferID/Memo is non number
 */
export const InvalidMemoICP = createCustomErrorClass("InvalidMemoICP");

/*
 * When the staking amount is not enough
 */
export const NotEnoughTransferAmount = createCustomErrorClass("NotEnoughTransferAmount");

/*
 * When the dissolve delay is negative
 */
export const ICPDissolveDelayLTMin = createCustomErrorClass("ICPDissolveDelayLTMin");

/*
 * When the dissolve delay is greater than the maximum
 */
export const ICPDissolveDelayGTMax = createCustomErrorClass("ICPDissolveDelayGTMax");

/*
 * When the dissolve delay is less than the current dissolve delay
 */
export const ICPDissolveDelayLTCurrent = createCustomErrorClass("ICPDissolveDelayLTCurrent");

/*
 * When the neuron is not found
 */
export const ICPNeuronNotFound = createCustomErrorClass("ICPNeuronNotFound");

/*
 * When the hot key is invalid
 */
export const ICPInvalidHotKey = createCustomErrorClass("ICPInvalidHotKey");

/*
 * When the hot key already exists
 */
export const ICPHotKeyAlreadyExists = createCustomErrorClass("ICPHotKeyAlreadyExists");

/*
 * When the split amount is not allowed
 */
export const ICPSplitNotAllowed = createCustomErrorClass("ICPSplitNotAllowed");

/*
 * Increase stake general warning
 */
export const ICPIncreaseStakeWarning = createCustomErrorClass("ICPIncreaseStakeWarning");

/*
 * Create neuron general warning
 */
export const ICPCreateNeuronWarning = createCustomErrorClass("ICPCreateNeuronWarning");
