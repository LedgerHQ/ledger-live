import { getEnv } from "../../../env";
import BigNumber from "bignumber.js";
import network from "../../../network";
import { patchOperationWithHash, encodeOperationId } from "../../../operation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import * as bech32 from "bech32";

const bearerToken = "<insert here>";
const indexerEndPoint = getEnv("API_ZILLIQA_INDEXER_API_ENDPOINT").replace(
	/\/$/,
	""
);
const nodeEndPoint = getEnv("API_ZILLIQA_NODE").replace(/\/$/, "");
const HRP = "zil";

function fromBech32(value: string): string {
	let decoded;

	try {
		decoded = bech32.decode(value);
	} catch (err) {
		throw new Error("Zilliqa address cannot be decoded.");
	}

	const prefix = decoded.prefix;
	if (prefix != HRP) {
		throw new Error("HPR mismatch: This is not a Zilliqa address.");
	}

	const pubkey = Buffer.from(bech32.fromWords(decoded.words));

	return "0x" + pubkey.toString("hex");
}

function toBech32(pubkey: string): string {
	if (pubkey.substring(0, 2) === "0x") {
		pubkey = pubkey.substring(2, pubkey.length);
	}

	const payload = Buffer.from(pubkey, "hex");
	let words = bech32.toWords(payload);

	return bech32.encode(HRP, words);
}

export const getAccount = async (addr: string) => {
	addr = fromBech32(addr);
	const { data } = await network({
		method: "POST",

		url: `${indexerEndPoint}`,

		data: {
			operationName: "UserBalance",
			variables: {
				input: {
					wallet: addr,
					token: "0x0000000000000000000000000000000000000000",
				},
			},
			query:
				"query UserBalance($input: WalletBalanceInput) {\n  getUserBalanceByToken(input: $input) {\n    tokenAddress\n    walletAddress\n    lastBlockID\n    amount\n  }\n}\n",
		},
		headers: {
			authorization: `Bearer ${bearerToken}`,
		},
	});

	if (data.data.getUserBalanceByToken === null) {
		return {
			blockHeight: 0,
			balance: new BigNumber(0),
			nonce: 0,
		};
	}

	// TODO: How do we obtain an appropriate nonce?
	const nonce = 0;
	return {
		blockHeight: data.data.getUserBalanceByToken.lastBlockID,
		balance: new BigNumber(data.data.getUserBalanceByToken.amount),
		nonce,
	};
};

function transactionToOperation(
	type: "IN" | "OUT",
	accountId: string,
	addr: string,
	transaction: any
): Operation {
	const ret: Operation = {
		id: encodeOperationId(accountId, transaction.TxId, type),
		accountId,
		fee: BigNumber(
			parseInt(transaction.gasAmount || 0) *
				parseInt(transaction.gasPrice || 0)
		),
		value: BigNumber(transaction.amount),
		type,
		// This is where you retrieve the hash of the transaction
		hash: transaction.TxId,
		blockHash: null,
		blockHeight: parseInt(transaction.blockID),
		date: new Date(), // TODO: new Date(transaction.timestamp),
		extra: {},
		senders: [toBech32(transaction.fromAddress)],
		recipients: transaction.toAddress
			? [toBech32(transaction.toAddress)]
			: [],
		// hasFailed: !transaction.success, // TODO:
	};

	return ret;
}

export const getOperations = async (
	accountId: string,
	addr: string,
	startAt: number
): Promise<Operation[]> => {
	addr = fromBech32(addr);

	const incoming_res = (
		await network({
			method: "POST",

			url: `${indexerEndPoint}`,

			data: {
				operationName: "TxDetails",
				variables: {
					input: {
						tokenAddress:
							"0x0000000000000000000000000000000000000000",
						toAddress: addr,
					},
				},
				query:
					"query TxDetails($input: TransactionDetailsInput) {\n  getTransactionDetails(input: $input) {\n    list {\n      blockID\n      TxId\n      toAddress\n      fromAddress\n      tokenAddress\n      amount\n      gasAmount\n      gasPrice\n    }\n  }\n}\n",
			},
			headers: {
				authorization: `Bearer ${bearerToken}`,
			},
		})
	).data.data;

	const outgoing_res = (
		await network({
			method: "POST",
			url: `${indexerEndPoint}`,

			data: {
				operationName: "TxDetails",
				variables: {
					input: {
						tokenAddress:
							"0x0000000000000000000000000000000000000000",
						fromAddress: addr,
					},
				},
				query:
					"query TxDetails($input: TransactionDetailsInput) {\n  getTransactionDetails(input: $input) {\n    list {\n      blockID\n      TxId\n      toAddress\n      fromAddress\n      tokenAddress\n      amount\n      gasAmount\n      gasPrice\n    }\n  }\n}\n",
			},
			headers: {
				authorization: `Bearer ${bearerToken}`,
			},
		})
	).data.data;

	const incoming =
		incoming_res && incoming_res.getTransactionDetails
			? incoming_res.getTransactionDetails.list
			: [];
	const outgoing =
		outgoing_res && outgoing_res.getTransactionDetails
			? outgoing_res.getTransactionDetails.list
			: [];

	const ret1: Array<Operation> = incoming.map((transaction) =>
		transactionToOperation("IN", accountId, addr, transaction)
	);
	const ret2: Array<Operation> = outgoing.map((transaction) =>
		transactionToOperation("OUT", accountId, addr, transaction)
	);
	const ret = [...ret1, ...ret2];
	return ret;
};
