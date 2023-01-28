import { $Shape } from "utility-types";
import { BigNumber } from "bignumber.js";
import type { ElrondAccount, Transaction } from "./types";
import { getFees } from "./api";
import { GAS, MIN_GAS_LIMIT } from "./constants";
import { ElrondEncodeTransaction } from "./encode";
import { isAmountSpentFromBalance } from "./logic";

/**
 * Create an empty t
 *
 * @returns {Transaction}
 */
export const createTransaction = (): Transaction => {
  return {
    family: "elrond",
    mode: "send",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    fees: new BigNumber(50000),
    gasLimit: MIN_GAS_LIMIT,
  };
};

/**
 * Apply patch to t
 *
 * @param {*} t
 * @param {*} patch
 */
export const updateTransaction = (
  t: Transaction,
  patch: $Shape<Transaction>
): Transaction => {
  return { ...t, ...patch };
};

/**
 * Prepare t before checking status
 *
 * @param {ElrondAccount} a
 * @param {Transaction} t
 */
export const prepareTransaction = async (
  a: ElrondAccount,
  t: Transaction
): Promise<Transaction> => {
  const preparedTx: Transaction = t;

  const tokenAccount =
    (t.subAccountId &&
      a.subAccounts &&
      a.subAccounts.find((ta) => ta.id === t.subAccountId)) ||
    null;

  if (tokenAccount) {
    preparedTx.data = ElrondEncodeTransaction.ESDTTransfer(t, tokenAccount);
    preparedTx.gasLimit = GAS.ESDT_TRANSFER;
  } else {
    switch (t.mode) {
      case "delegate":
        preparedTx.gasLimit = GAS.DELEGATE;
        preparedTx.data = ElrondEncodeTransaction.delegate();
        break;
      case "claimRewards":
        preparedTx.gasLimit = GAS.CLAIM;
        preparedTx.data = ElrondEncodeTransaction.claimRewards();
        break;
      case "withdraw":
        preparedTx.gasLimit = GAS.DELEGATE;
        preparedTx.data = ElrondEncodeTransaction.withdraw();
        break;
      case "reDelegateRewards":
        preparedTx.gasLimit = GAS.DELEGATE;
        preparedTx.data = ElrondEncodeTransaction.reDelegateRewards();
        break;
      case "unDelegate":
        preparedTx.gasLimit = GAS.DELEGATE;
        preparedTx.data = ElrondEncodeTransaction.unDelegate(t);
        break;
      case "send":
        break;
      default:
        throw new Error("Unsupported transaction mode: " + t.mode);
    }
  }

  if (t.useAllAmount) {
    // Set the max amount
    preparedTx.amount = tokenAccount
      ? tokenAccount.balance
      : a.spendableBalance;

    // Compute estimated fees for that amount
    preparedTx.fees = await getFees(preparedTx);

    // Adjust max amount according to computed fees
    if (!tokenAccount && isAmountSpentFromBalance(t.mode)) {
      preparedTx.amount = preparedTx.amount.gt(preparedTx.fees)
        ? preparedTx.amount.minus(preparedTx.fees)
        : new BigNumber(0);
    }
  } else {
    preparedTx.fees = await getFees(preparedTx);
  }

  return preparedTx;
};
