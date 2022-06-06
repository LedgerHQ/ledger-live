import { avalancheClient } from "./api/client";
import { BigNumber } from "bignumber.js";

export const DEFAULT_GAS_LIMIT = 21000;

const getFeesForTransaction = async (): Promise<BigNumber> => {
    const gasPrice = await getGasPrice();

    return new BigNumber(DEFAULT_GAS_LIMIT).multipliedBy(gasPrice);
}

export const getGasPrice = async () => {
    const cChain = avalancheClient().CChain();

    const baseFee = await cChain.getBaseFee();
    const adjustedBaseFee = getAdjustedBaseFee(baseFee);
    const priorityFee = await cChain.getMaxPriorityFeePerGas();

    return new BigNumber(adjustedBaseFee).plus(priorityFee);
}

/**
 * In accordance with the Avalance wallet, adjust the gas price by +25%
 * @param baseFee 
 */
const getAdjustedBaseFee = (baseFee: string) => new BigNumber(baseFee).multipliedBy(1.25);

export default getFeesForTransaction;