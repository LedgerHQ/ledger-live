import type { Transaction } from "./types";
import type { Account } from "@ledgerhq/types-live";

import { getNonce } from "./logic";
import {
	TxParams,
	TransactionFactory,
	Transaction as ZilliqaTransaction,
} from "@zilliqa-js/account";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import { BN, Long, bytes } from "@zilliqa-js/util";

const chainId = 333; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);

const zilliqa = new Zilliqa("https://dev-api.zilliqa.com");

const getTransactionParams = (a: Account, t: Transaction) => {
	return {
		method: "transfer",
		args: {
			dest: t.recipient,
			value: t.amount.toString(),
		},
	};
};

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (a: Account, t: Transaction) => {
	console.log("js-: Build transaction");

	const nonce = getNonce(a);
	console.log("js-: nonce - ", nonce);

	const params: TxParams = {
		version: VERSION,
		toAddr: t.recipient,
		amount: new BN(t.amount.toString()),
		gasPrice: new BN(0),
		gasLimit: new Long(0),
	};

	const tx = new ZilliqaTransaction(params, zilliqa.provider);

	console.log(tx.bytes.toString("hex"));
	//	console.log("js-: ", JSON.stringify(unsigned));
	return "";
};
