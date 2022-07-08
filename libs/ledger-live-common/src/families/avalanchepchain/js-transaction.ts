import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import type { Transaction } from "./types";
// import getFeesForTransaction from "./js-getFeesForTransaction";
// import estimateMaxSpendable from "./js-estimateMaxSpendable";

const createTransaction = (): Transaction => ({
    family: "avalanchepchain",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    fees: null,
    mode: "delegate"
});

const prepareTransaction = async (account: Account, transaction: Transaction) => {
    return transaction;
};

const updateTransaction = (t, patch) => ({ ...t, ...patch });

export {
    createTransaction,
    prepareTransaction,
    updateTransaction
};
