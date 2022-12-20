import type { Transaction, ZilliqaAccount } from "./types";

import { getNonce } from "./logic";
import {
	TxParams,
	TransactionFactory,
	Transaction as ZilliqaTransaction,
} from "@zilliqa-js/account";
import { BN, Long, bytes } from "@zilliqa-js/util";
import { zilliqa, VERSION } from "./api";

export const buildNativeTransaction = async (
	account: ZilliqaAccount,
	toAddr: string,
	nonce: number,
	amount: BN,
	signature?: string,
	maybeGasPrice?: BN
): Promise<ZilliqaTransaction> => {
	console.log("ZILLIQA: buildNativeTransaction.");

	if (!account.zilliqaResources) {
		throw new Error("Zilliqa resources missing on account.");
	}

	const gasPrice = maybeGasPrice || new BN(2000000000);
	const gasLimit = new Long(50); // Gas limit is 50 units according to https://dev.zilliqa.com/basics/basics-zil-gas/?h=gas

	const params: TxParams = {
		version: VERSION,
		toAddr,
		amount,
		gasPrice,
		gasLimit,
		nonce: nonce,
		pubKey: account.zilliqaResources
			? account.zilliqaResources.publicKey
			: "",
		code: "",
		data: "",
		signature,
	};
	const tx = new ZilliqaTransaction(params, zilliqa.provider);
	return tx;
};

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (a: ZilliqaAccount, t: Transaction) => {
	const tx = await buildNativeTransaction(
		a,
		t.recipient,
		getNonce(a),
		new BN(t.amount.toString())
	);
	return tx.bytes.toString("hex");
};
