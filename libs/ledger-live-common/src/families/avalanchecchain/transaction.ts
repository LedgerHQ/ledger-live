import type { Transaction, TransactionRaw } from "./types";
import { BigNumber } from "bignumber.js";
import {
    fromTransactionCommonRaw,
    toTransactionCommonRaw,
} from "../../transaction/common";
import type { Account } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

export const formatTransaction = (
    { amount, recipient, useAllAmount }: Transaction,
    account: Account
): string =>
    `
    SEND ${useAllAmount
        ? "MAX"
        : amount.isZero()
            ? ""
            : " " +
            formatCurrencyUnit(getAccountUnit(account), amount, {
                showCode: true,
                disableRounding: true,
            })
    }${recipient ? `\nTO ${recipient}` : ""}`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
    const common = fromTransactionCommonRaw(tr);
    return {
        ...common,
        family: tr.family,
        fees: tr.fees ? new BigNumber(tr.fees) : null,
    };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
    const common = toTransactionCommonRaw(t);
    return {
        ...common,
        family: t.family,
        fees: t.fees?.toString() || null,
    };
};

export default { formatTransaction, fromTransactionRaw, toTransactionRaw };