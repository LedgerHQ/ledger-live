import { BigNumber } from "bignumber.js";
import { AlgorandAPI } from "./api";
import { estimateMaxSpendable } from "./js-estimateMaxSpendable";
import { getEstimatedFees } from "./js-getFeesForTransaction";
import type { AlgorandAccount, Transaction } from "./types";

/**
 * Calculate fees for the current transaction
 * @param {PolkadotAccount} a
 * @param {Transaction} t
 */
const prepareTransaction =
  (algorandAPI: AlgorandAPI) =>
  async (account: AlgorandAccount, transaction: Transaction): Promise<Transaction> => {
    let recipient: string;
    let amount: BigNumber;
    if (transaction.mode === "send") {
      recipient = transaction.recipient;
      amount = transaction.useAllAmount
        ? await estimateMaxSpendable(algorandAPI)({ account, transaction })
        : transaction.amount;
    } else if (transaction.mode === "optIn" || transaction.mode === "claimReward") {
      recipient = account.freshAddress;
      amount = new BigNumber(0);
    } else {
      throw new Error(`Unsupported transaction mode '${transaction.mode}'`);
    }

    const fees = await getEstimatedFees(algorandAPI)(account, transaction);

    return { ...transaction, fees, amount, recipient };
  };

export default prepareTransaction;
