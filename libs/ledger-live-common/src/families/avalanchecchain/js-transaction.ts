import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import type { Transaction } from "./types";
import getFeesForTransaction from "./js-getFeesForTransaction";

const createTransaction = (): Transaction => ({
    family: "avalanchecchain",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    fees: null,
});

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

const prepareTransaction = async (account: Account, transaction: Transaction) => {
    let fees = transaction.fees;

    fees = await getFeesForTransaction();

    if (!sameFees(transaction.fees, fees)) {
        return { ...transaction, fees };
    }

    return transaction;
};

const updateTransaction = (t, patch) => ({ ...t, ...patch });

export {
    createTransaction,
    prepareTransaction,
    updateTransaction
};
