import BigNumber from "bignumber.js";

/** Neuron amounts are e8s bigints in the coin module; the display components take BigNumber. */
export const toBigNumber = (value: bigint): BigNumber => new BigNumber(value.toString());
