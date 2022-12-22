import type {
	Account,
	AccountBridge,
	CurrencyBridge,
	Operation,
	SignedOperation,
} from "@ledgerhq/types-live";
import type { Transaction, ZilliqaAccount } from "../types";
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
import {
	TxParams,
	TransactionFactory,
	Transaction as ZilliqaTransaction,
} from "@zilliqa-js/account";
import { BN, Long, bytes } from "@zilliqa-js/util";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import { patchOperationWithHash } from "../../../operation";
import { fromBech32, toBech32 } from "../utils";
import { RPCMethod } from "@zilliqa-js/core";
import { getAddressFromPublicKey } from "@zilliqa-js/crypto";
import { buildNativeTransaction } from "../js-buildTransaction";
import {
	getMinimumGasPrice,
	broadcastTransaction,
	ZILLIQA_TX_GAS_LIMIT,
} from "../api";
import { getNonce } from "../logic";
import {
	createTransaction,
	updateTransaction,
	prepareTransaction,
} from "../js-transaction";

const receive = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
	preload: async () => {
		return {};
	},
	hydrate: () => {},
	scanAccounts,
};

const getTransactionStatus = (account: ZilliqaAccount, t: Transaction) => {
	console.log("ZILLIQA: getTransactionStatus.");
	const errors: any = {};
	const warnings: any = {};
	const useAllAmount = !!t.useAllAmount;

	let { gasPrice, gasLimit } = t;
	if (!gasPrice) {
		gasPrice = new BN(0);
	}

	if (!gasLimit) {
		gasLimit = new BN(ZILLIQA_TX_GAS_LIMIT);
	}

	const estimatedFees = new BigNumber(gasPrice.mul(gasLimit).toString());

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
	console.log("ZILLIQA: estimateMaxSpendable.");
	throw new Error("estimateMaxSpendable not implemented");
};

const broadcast = async ({
	account,
	signedOperation,
}: {
	account: ZilliqaAccount;
	signedOperation: SignedOperation;
}): Promise<Operation> => {
	console.log("ZILLIQA: broadcast.");
	const { signature, operation } = signedOperation;
	const i = signature.indexOf(":");

	const sign = signature.substring(i + 1, signature.length);
	// Unfortunately, the zilliqa-js API only allows encoding of the
	// transaction, but not decoding. In a future version of this implmentation
	// it would be preferable to unpack the transaction payload rather than
	// reconstructing the transaction:
	//
	// const payload = signature.substring(0, i);
	// const params = decodeTransactionProto(payload); /// <- this function does not exist
	//

	// Reconstructing the transaction
	const toAddr = fromBech32(operation.recipients[0]);
	console.log("OPERATION:", operation);
	const gasPrice = await getMinimumGasPrice();
	const tx = await buildNativeTransaction(
		account,
		toAddr,
		getNonce(account),
		new BN(operation.extra.amount.toString()),
		gasPrice,
		sign
	);

	const params = tx.txParams;

	// Broadcasting transaction
	let hash: string;
	try {
		hash = await broadcastTransaction(params);
	} catch (e) {
		console.log("TX:", params);
		console.log("Gas limit:", params.gasLimit.toString());
		console.log("Gas price:", params.gasPrice.toString());
		console.log("Amount:", params.amount.toString());

		console.log(e);
		throw Error("Failed to broadcast.");
	}

	return patchOperationWithHash(operation, hash);
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
