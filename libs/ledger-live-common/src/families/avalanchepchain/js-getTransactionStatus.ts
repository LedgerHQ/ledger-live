import { BigNumber } from "bignumber.js";
import {
    NotEnoughBalance,
    RecipientRequired,
    InvalidAddress,
    FeeNotLoaded,
    AmountRequired,
    InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import { Account, TransactionStatus } from "../../types";
import { Transaction } from "./types";
import { isValidAddress } from "./logic";

const getTransactionStatus = async (
    account: Account,
    transaction: Transaction
): Promise<TransactionStatus> => {
    const errors: any = {};
    const warnings: any = {};
    const useAllAmount = !!transaction.useAllAmount;

    if (account.freshAddress === transaction.recipient) {
        errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    }

    const estimatedFees = transaction.fees || new BigNumber(0);

    const amount = useAllAmount
        ? account.spendableBalance.minus(estimatedFees)
        : new BigNumber(transaction.amount);

    if (amount.lte(0) && !transaction.useAllAmount) {
        errors.amount = new AmountRequired();
    }

    const totalSpent = amount.plus(estimatedFees);

    if (totalSpent.gt(account.spendableBalance)) {
        errors.amount = new NotEnoughBalance();
    }

    if (!errors.amount && account.spendableBalance.lt(estimatedFees)) {
        errors.amount = new NotEnoughBalance();
    }

    if (transaction.mode === "send") {
        if (!transaction.recipient) {
            errors.recipient = new RecipientRequired();
        } else if (!isValidAddress(transaction.recipient)) {
            errors.recipient = new InvalidAddress("", {
                currencyName: account.currency.name,
            });
        }
    }

    return Promise.resolve({
        errors,
        warnings,
        estimatedFees,
        amount,
        totalSpent,
    });
};

export default getTransactionStatus;