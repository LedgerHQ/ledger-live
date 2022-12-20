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
import { zilliqa } from "../api";
import { getNonce } from "../logic";

const receive = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
	preload: async () => {
		return {};
	},
	hydrate: () => {},
	scanAccounts,
};

const createTransaction = (a: ZilliqaAccount): Transaction => {
	console.log("ZILLIQA: createTransaction.");
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

const getTransactionStatus = (account: ZilliqaAccount, t: Transaction) => {
	console.log("ZILLIQA: getTransactionStatus.");

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
	const payload = signature.substring(0, i);
	const sign = signature.substring(i + 1, signature.length);

	const toAddr = fromBech32(operation.recipients[0]);

	const tx = await buildNativeTransaction(
		account,
		toAddr,
		getNonce(account),
		new BN(operation.value.toString()),
		sign
	);
	const params = tx.txParams;
	if (account.zilliqaResources) {
		const sender = getAddressFromPublicKey(
			account.zilliqaResources.publicKey
		);
		console.log("Pub key:", account.zilliqaResources.publicKey);
		console.log("Addr from pub:", sender);
		console.log("Addr from pub:", toBech32(sender));
	}
	console.log("Value:", operation.value.toString());
	console.log(params);
	console.log("Value:", params.amount.toString());
	console.log("GasPrice:", params.gasPrice.toString());

	console.log(signature);
	console.log(">>>");
	// throw new Error("broadcast not implemented");

	console.log("Sending", JSON.stringify(params));
	let hash: string;
	try {
		const response = await zilliqa.blockchain.provider.send(
			RPCMethod.CreateTransaction,
			{
				...params,
				priority: false,
			}
		);

		if (response.error) {
			throw response.error;
		}

		hash = response.result.TranID;
	} catch (e) {
		console.log(e);
		throw Error("FAILED broadcast");
	}
	console.log("HASH:", hash);
	//	const walletAccount = getWalletAccount(account);
	//	const hash = await wallet.broadcastTx(walletAccount, signature);
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
