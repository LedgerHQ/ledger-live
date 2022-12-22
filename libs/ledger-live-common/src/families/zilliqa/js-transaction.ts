import { $Shape } from "utility-types";
import { BigNumber } from "bignumber.js";
import type { ZilliqaAccount, Transaction } from "./types";
import getEstimatedFees from "./js-getFeesForTransaction";
import { BN, Long, bytes } from "@zilliqa-js/util";
import { ZILLIQA_TX_GAS_LIMIT, getMinimumGasPrice } from "./api";

const isSame = (a, b) => (!a || !b ? false : a === b);

export const createTransaction = (a: ZilliqaAccount): Transaction => {
	console.log("ZILLIQA: createTransaction.");
	return {
		family: "zilliqa",
		amount: new BigNumber(0),
		recipient: "",
		gasLimit: new BN(ZILLIQA_TX_GAS_LIMIT),
		gasPrice: new BN(0),
	};
};

export const updateTransaction = (t, patch) => {
	console.log("ZILLIQA: updateTransaction.");
	return { ...t, ...patch };
};

export const prepareTransaction = async (
	a: ZilliqaAccount,
	t: Transaction
): Promise<Transaction> => {
	console.log("ZILLIQA: prepareTransaction.");
	const gasLimit = new BN(ZILLIQA_TX_GAS_LIMIT);
	const gasPrice = await getMinimumGasPrice();
	if (!isSame(gasLimit, t.gasLimit) || !isSame(gasPrice, t.gasPrice)) {
		console.log("Updating price and limit");
		return {
			...t,
			gasLimit,
			gasPrice,
		};
	}
	return t;
};
