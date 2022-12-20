import { getEnv } from "../../../env";
import BigNumber from "bignumber.js";
import network from "../../../network";
import { patchOperationWithHash, encodeOperationId } from "../../../operation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import { fromBech32, toBech32 } from "../utils";
import { BN, Long, bytes } from "@zilliqa-js/util";
import { Zilliqa } from "@zilliqa-js/zilliqa";

const bearerToken = "<insert token here>";
const indexerEndPoint = getEnv("API_ZILLIQA_INDEXER_API_ENDPOINT").replace(
	/\/$/,
	""
);
// http://api.zindex.zilliqa.com/
const nodeEndPoint = getEnv("API_ZILLIQA_NODE").replace(/\/$/, "");

const ZILLIQA_MAINNET = 1;
const ZILLIQA_DEVNET = 333;
const msgVersion = 1; // current msgVersion
export const VERSION = bytes.pack(ZILLIQA_MAINNET, msgVersion);
export const zilliqa = new Zilliqa("https://api.zilliqa.com");

export const getAccount = async (addr: string) => {
	console.log("ZILLIQA: getAccount.");
	addr = fromBech32(addr);
	console.log("CHAIN:", await zilliqa.blockchain.getBlockChainInfo());
	console.log("CHAIN:", await zilliqa.blockchain.getBalance(addr));
	// Implementation using node
	const resp = await network({
		method: "POST",

		url: `${nodeEndPoint}`,

		data: {
			id: "1",
			jsonrpc: "2.0",
			method: "GetBalance",
			params: [addr.substring(2, addr.length)],
		},
		headers: {
			contentType: "application/json",
		},
	});

	const node_data = resp.data;
	if (!node_data || !node_data.result) {
		return {
			blockHeight: 0,
			balance: new BigNumber(0),
			nonce: 0,
		};
	}

	// Implementation using indexer
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

	// TODO: How do we obtain an appropriate nonce from indexer and drop node implementation or get blockheight from node and drop indexer call?
	const nonce = node_data.result.nonce;
	console.log("Recieved nonce:", nonce);
	return {
		blockHeight: data.data.getUserBalanceByToken.lastBlockID,
		balance: new BigNumber(data.data.getUserBalanceByToken.amount),
		nonce: parseInt(nonce) + 1,
	};
};

export const getMinimumGasPrice = async () => {
	//    return this.provider.send<string, string>(RPCMethod.GetMinimumGasPrice);
	return 0;
};

function transactionToOperation(
	type: "IN" | "OUT",
	accountId: string,
	addr: string,
	transaction: any
): Operation {
	console.log("ZILLIQA: transactionToOperation.");
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
	console.log("ZILLIQA: getOperations.");
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
