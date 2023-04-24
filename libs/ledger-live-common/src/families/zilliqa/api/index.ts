import { getEnv } from "../../../env";
import BigNumber from "bignumber.js";
import network from "../../../network";
import { encodeOperationId } from "../../../operation";
import { Operation } from "@ledgerhq/types-live";
import { fromBech32, toBech32 } from "../utils";
import { BN, bytes } from "@zilliqa-js/util";
import { Zilliqa } from "@zilliqa-js/zilliqa";
import { TxParams } from "@zilliqa-js/account";
import { RPCMethod } from "@zilliqa-js/core";

const indexerEndPoint = getEnv("API_ZILLIQA_INDEXER_API_ENDPOINT").replace(
  /\/$/,
  ""
);
const nodeEndPoint = getEnv("API_ZILLIQA_NODE").replace(/\/$/, "");

const ZILLIQA_MAINNET = 1;
// const ZILLIQA_DEVNET = 333;
const msgVersion = 1; // current msgVersion
export const VERSION = bytes.pack(ZILLIQA_MAINNET, msgVersion);
export const zilliqa = new Zilliqa(nodeEndPoint);
export const ZILLIQA_TX_GAS_LIMIT = 50; // Gas limit is 50 units according to https://dev.zilliqa.com/basics/basics-zil-gas/?h=gas
export const ZILLIQA_TX_GAS_PRICE = 2000000000;
export const broadcastTransaction = async (params: TxParams) => {
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

  return response.result.TranID;
};

export const getAccount = async (addr: string) => {
  addr = fromBech32(addr);

  // Getting balance from chain
  const node_data = await zilliqa.blockchain.getBalance(addr);
  if (!node_data || !node_data.result) {
    return {
      blockHeight: 0,
      balance: new BigNumber(0),
      nonce: 0,
    };
  }
  const nonce = node_data.result.nonce;

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
  });

  if (data.data.getUserBalanceByToken === null) {
    return {
      blockHeight: 0,
      balance: new BigNumber(0),
      nonce: 0,
    };
  }

  return {
    blockHeight: data.data.getUserBalanceByToken.lastBlockID,
    balance: new BigNumber(data.data.getUserBalanceByToken.amount),
    nonce: parseInt(nonce) + 1,
  };
};

export const getMinimumGasPrice = async () => {
  const r = await zilliqa.blockchain.getMinimumGasPrice();
  if (!r.result) {
    throw new Error("Could not fetch minimum gas price");
  }

  return new BN(r.result);
};

const transactionToOperation = async (
  type: "IN" | "OUT",
  accountId: string,
  addr: string,
  transaction: any
) => {
  let { gasPrice, cumulativeGas } = transaction;
  gasPrice = new BN(gasPrice);
  cumulativeGas = new BN(cumulativeGas);
  const blockHeight = parseInt(transaction.blockId);

  const fee = new BigNumber(gasPrice.mul(cumulativeGas).toString());
  let amount = new BigNumber(transaction.amount ? transaction.amount : 0);

  if (type === "OUT") {
    amount = amount.plus(fee);
  }

  let date = new Date();
  if (transaction.timestamp) {
    date = new Date(parseInt(transaction.timestamp) / 1000);
  } else {
    // In case timestamp is not present in the indexer, we get the stamp directly
    // from the node:
    const block = await zilliqa.blockchain.getTxBlock(blockHeight);
    if (block.result) {
      date = new Date(parseInt(block.result.header.Timestamp) / 1000);
    }
  }

  let txId = transaction.txId;
  if (!txId.startsWith("0x")) {
    txId = "0x" + txId;
  }

  const ret: Operation = {
    id: encodeOperationId(accountId, txId, type),
    accountId,
    fee: fee,
    value: amount,
    type,
    // This is where you retrieve the hash of the transaction
    hash: txId,
    blockHash: null,
    blockHeight,
    date,
    extra: {
      //      amount: transaction.amount,
    },
    senders: [toBech32(transaction.fromAddress)],
    recipients: transaction.toAddress ? [toBech32(transaction.toAddress)] : [],
    hasFailed: transaction.accepted === false,
  };

  return ret;
};

export const getOperations = async (
  accountId: string,
  addr: string,
  _startAt: number
): Promise<Operation[]> => {
  addr = fromBech32(addr).toLowerCase();

  const incoming_res = (
    await network({
      method: "POST",

      url: `${indexerEndPoint}`,

      data: {
        operationName: "TxDetails",
        variables: {
          input: {
            tokenAddress: "0x0000000000000000000000000000000000000000",
            toAddress: addr,
          },
        },
        query:
          "query TxDetails($input: TransactionDetailsInput) {\n  getTransactionDetails(input: $input) {\n    list {\n    accepted\n     timestamp\n      blockId\n      txId\n      toAddress\n      fromAddress\n      tokenAddress\n      amount\n      cumulativeGas\n      gasPrice\n    }\n  }\n}\n",
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
            tokenAddress: "0x0000000000000000000000000000000000000000",
            fromAddress: addr,
          },
        },
        query:
          "query TxDetails($input: TransactionDetailsInput) {\n  getTransactionDetails(input: $input) {\n    list {\n    accepted\n     timestamp\n      blockId\n      txId\n      toAddress\n      fromAddress\n      tokenAddress\n      amount\n      cumulativeGas\n      gasPrice\n    }\n  }\n}\n",
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

  const ret1: Array<Operation> = await Promise.all(
    incoming.map(
      async (transaction) =>
        await transactionToOperation("IN", accountId, addr, transaction)
    )
  );
  const ret2: Array<Operation> = await Promise.all(
    outgoing.map(
      async (transaction) =>
        await transactionToOperation("OUT", accountId, addr, transaction)
    )
  );
  const ret = [...ret1, ...ret2];

  ret.sort((a, b) => {
    return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  });

  return ret;
};
