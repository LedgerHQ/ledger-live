import { BigNumber } from "bignumber.js";
import { getFees } from "./api";
import { GAS } from "./constants";
import { ElrondEncodeTransaction } from "./encode";
import { Transaction } from "./types";

/**
 * Fetch the transaction fees for a transaction
 * Set gas limit and transaction data depending on transaction mode
 * @param {Transaction} t
 */
const getEstimatedFees = async (t: Transaction): Promise<BigNumber> => {
  switch (t?.mode) {
    case "reDelegateRewards":
      t.gasLimit = GAS.DELEGATE;

      t.data = ElrondEncodeTransaction.reDelegateRewards();
      break;
    case "withdraw":
      t.gasLimit = GAS.DELEGATE;

      t.data = ElrondEncodeTransaction.withdraw();
      break;
    case "unDelegate":
      t.gasLimit = GAS.DELEGATE;

      t.data = ElrondEncodeTransaction.unDelegate(t);
      break;
    case "delegate":
      t.gasLimit = GAS.DELEGATE;

      t.data = ElrondEncodeTransaction.delegate();
      break;

    case "claimRewards":
      t.gasLimit = GAS.CLAIM;

      t.data = ElrondEncodeTransaction.claimRewards();
      break;

    default:
      break;
  }

  return await getFees(t);
};

export default getEstimatedFees;
