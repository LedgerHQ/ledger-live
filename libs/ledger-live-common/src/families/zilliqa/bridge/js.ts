import type {
	Account,
	AccountBridge,
	CurrencyBridge,
} from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { BigNumber } from "bignumber.js";
import { sync, scanAccounts } from "../js-synchronisation";
import {
	NotEnoughBalance,
	RecipientRequired,
	InvalidAddress,
	FeeTooHigh,
} from "@ledgerhq/errors";
import signOperation from "../js-signOperation";
import { isInvalidRecipient } from "../../../bridge/mockHelpers";

const receive = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
	preload: async () => {
		return {};
	},
	hydrate: () => {},
	scanAccounts,
};

const createTransaction = (a: Account): Transaction => {
	console.log("BRIDGE: Creating transaction");
	return {
		family: "zilliqa",
		amount: new BigNumber(0),
		recipient: "",
		fee: new BigNumber(0),
		//		fee: null,
		//		tag: undefined,
		//		networkInfo: null,
		//		feeCustomUnit: null,
	};
};

const prepareTransaction = async (a, t) => t;
const updateTransaction = (t, patch) => ({ ...t, ...patch });

const getTransactionStatus = (account: Account, t: Transaction) => {
	console.log("BRIDGE: getTransactionStatus");

	const errors: any = {};
	const warnings: any = {};
	const useAllAmount = !!t.useAllAmount;

	const estimatedFees = BigNumber(5000);

	const totalSpent = useAllAmount
		? account.balance
		: BigNumber(t.amount).plus(estimatedFees);

	const amount = useAllAmount
		? account.balance.minus(estimatedFees)
		: BigNumber(t.amount);

	if (amount.gt(0) && estimatedFees.times(10).gt(amount)) {
		warnings.amount = new FeeTooHigh();
	}

	if (totalSpent.gt(account.balance)) {
		errors.amount = new NotEnoughBalance();
	}

	if (!t.recipient) {
		errors.recipient = new RecipientRequired();
	} else if (isInvalidRecipient(t.recipient)) {
		errors.recipient = new InvalidAddress();
	}

	return Promise.resolve({
		errors,
		warnings,
		estimatedFees,
		amount,
		totalSpent,
	});
};

const estimateMaxSpendable = () => {
	throw new Error("estimateMaxSpendable not implemented");
};

const broadcast = () => {
	throw new Error("broadcast not implemented");
};

const accountBridge: AccountBridge<Transaction> = {
	estimateMaxSpendable,
	createTransaction,
	updateTransaction,
	getTransactionStatus,
	prepareTransaction,
	sync,
	receive,
	signOperation,
	broadcast,
};

export default { currencyBridge, accountBridge };
