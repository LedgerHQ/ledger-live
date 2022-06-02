import { avalancheClient } from "./api/client";
import { BigNumber } from "bignumber.js";

export const DEFAULT_GAS_LIMIT = new BigNumber(21000);

const getFeesForTransaction = async (): Promise<BigNumber> => {
    const gasPrice = await getGasPrice();

    return DEFAULT_GAS_LIMIT.multipliedBy(gasPrice);
}

export const getGasPrice = async () => {
    const cChain = avalancheClient().CChain();

    const baseFee = await cChain.getBaseFee();
    const priorityFee = await cChain.getMaxPriorityFeePerGas();

    const adjustedBaseFee = getAdjustedBaseFee(baseFee);
    return new BigNumber(adjustedBaseFee).plus(priorityFee);
}

/**
 * In accordance with the Avalance wallet, return the gas price + 25%
 * @param baseFee 
 */
const getAdjustedBaseFee = baseFee => new BigNumber(baseFee).multipliedBy(1.25);

export default getFeesForTransaction;