import BigNumber from "bignumber.js";
import { CASPER_MINIMUM_VALID_AMOUNT_MOTES } from "../../constants";
import { getEstimatedFees } from "../../logic/estimateFees";
import type { Transaction } from "../../types";
import { TEST_ADDRESSES, TEST_TRANSFER_IDS } from "./addresses.fixture";

export const createMockTransaction = (options?: Partial<Transaction>): Transaction => {
  const defaultFees = getEstimatedFees();

  const transaction: Transaction = {
    family: "casper",
    amount:
      options?.amount instanceof BigNumber
        ? options.amount
        : new BigNumber(options?.amount || CASPER_MINIMUM_VALID_AMOUNT_MOTES),
    recipient: options?.recipient || TEST_ADDRESSES.RECIPIENT_SECP256K1,
    fees: options?.fees instanceof BigNumber ? options.fees : defaultFees,
    transferId: options?.transferId,
    useAllAmount: options?.useAllAmount || false,
  };

  return { ...transaction, ...options };
};

export const createMockTransactionSet = (): Transaction[] => {
  return [
    createMockTransaction({ amount: new BigNumber("1000000000") }),
    createMockTransaction({ recipient: TEST_ADDRESSES.INVALID }),
    createMockTransaction({ amount: new BigNumber("0") }),
    createMockTransaction({ amount: new BigNumber("999000000000") }),
    createMockTransaction({ transferId: TEST_TRANSFER_IDS.VALID }),
    createMockTransaction({ transferId: TEST_TRANSFER_IDS.INVALID }),
    createMockTransaction({ useAllAmount: true }),
  ];
};
