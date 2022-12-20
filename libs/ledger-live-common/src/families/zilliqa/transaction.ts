import type { Transaction, TransactionRaw } from "./types";
import {
	formatTransactionStatusCommon as formatTransactionStatus,
	fromTransactionCommonRaw,
	fromTransactionStatusRawCommon as fromTransactionStatusRaw,
	toTransactionCommonRaw,
	toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "../../transaction/common";
import type { Account } from "@ledgerhq/types-live";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
export const formatTransaction = (t: Transaction, account: Account): string => `
SEND ${formatCurrencyUnit(getAccountUnit(account), t.amount, {
	showCode: true,
	disableRounding: true,
})}
TO ${t.recipient}`;

const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
	console.log("ZILLIQA: fromTransactionRaw.");
	const common = fromTransactionCommonRaw(tr);
	return { ...common, family: tr.family };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
	console.log("ZILLIQA: toTransactionRaw.");
	const common = toTransactionCommonRaw(t);
	return { ...common, family: t.family };
};

export default {
	formatTransaction,
	fromTransactionRaw,
	toTransactionRaw,
	fromTransactionStatusRaw,
	toTransactionStatusRaw,
	formatTransactionStatus,
};
