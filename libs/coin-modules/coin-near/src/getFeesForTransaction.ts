import { BigNumber } from "bignumber.js";
import { computeFees } from "./logic/fees";
import { getGasPrice } from "./network/node";
import { getCurrentNearPreloadData } from "./preload-data";
import { Transaction } from "./types";

const getEstimatedFees = async (transaction: Transaction): Promise<BigNumber> => {
  const rawGasPrice = await getGasPrice();
  const gasPrice = new BigNumber(rawGasPrice);

  return computeFees({
    mode: transaction.mode,
    recipient: transaction.recipient,
    useAllAmount: transaction.useAllAmount ?? false,
    gasPrice,
    costs: getCurrentNearPreloadData(),
  });
};

export default getEstimatedFees;
