import { log } from "@ledgerhq/logs";

import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  FETCH_TXNS_LIMIT,
  MAINNET_INDEX_CANISTER_ID,
  MAINNET_LEDGER_CANISTER_ID,
  ICP_NETWORK_URL,
} from "../consts";
import { getAgent } from "../dfinity/agent";
import type {
  GetAccountIdentifierTransactionsResponse,
  TransactionWithId,
} from "../dfinity/candid";
import {
  ledgerIdlFactory,
  indexIdlFactory,
  getCanisterIdlFunc,
  Principal,
  encodeCanisterIdlFunc,
  decodeCanisterIdlFunc,
  fromNullable,
} from "../dfinity/candid";

export const fetchBlockHeight = async (): Promise<BigNumber> => {
  const canisterId = Principal.fromText(MAINNET_LEDGER_CANISTER_ID);
  const queryBlocksRawRequest = {
    start: BigInt(0),
    length: BigInt(1),
  };

  const queryBlocksIdlFunc = getCanisterIdlFunc(ledgerIdlFactory, "query_blocks");
  const queryBlocksargs = encodeCanisterIdlFunc(queryBlocksIdlFunc, [queryBlocksRawRequest]);

  const agent = await getAgent(ICP_NETWORK_URL);
  const blockHeightRes = await agent.query(canisterId, {
    arg: queryBlocksargs,
    methodName: "query_blocks",
  });

  invariant(blockHeightRes.status === "replied", "[ICP](fetchBlockHeight) Query failed");

  const decodedIdl = decodeCanisterIdlFunc<[{ chain_length: bigint }]>(
    queryBlocksIdlFunc,
    blockHeightRes.reply.arg,
  );
  const decoded = fromNullable(decodedIdl);
  invariant(decoded, "[ICP](fetchBlockHeight) Decoding failed");

  return BigNumber(decoded.chain_length.toString());
};

export const broadcastTxn = async (
  payload: Buffer,
  canisterId: string,
  type: "call" | "read_state",
) => {
  log("debug", `[ICP] Broadcasting ${type} to ${canisterId}, body: ${payload.toString("hex")}`);
  const res = await fetch(`${ICP_NETWORK_URL}/api/v3/canister/${canisterId}/${type}`, {
    body: new Uint8Array(payload),
    method: "POST",
    headers: {
      "Content-Type": "application/cbor",
    },
  });

  if (res.status === 200) {
    return await res.arrayBuffer();
  }

  throw new Error(`Failed to broadcast transaction: ${res.text()}`);
};

export const fetchBalance = async (address: string): Promise<BigNumber> => {
  const agent = await getAgent(ICP_NETWORK_URL);
  const indexCanister = Principal.fromText(MAINNET_INDEX_CANISTER_ID);
  const getBalanceIdlFunc = getCanisterIdlFunc(indexIdlFactory, "get_account_identifier_balance");
  const getBalanceArgs = encodeCanisterIdlFunc(getBalanceIdlFunc, [address]);

  const balanceRes = await agent.query(indexCanister, {
    arg: getBalanceArgs,
    methodName: "get_account_identifier_balance",
  });

  if (balanceRes.status !== "replied") {
    log("debug", `[ICP](fetchBalance) Query failed: ${balanceRes.status}`);
    return BigNumber(0);
  }

  const decodedBalance = decodeCanisterIdlFunc<[bigint]>(getBalanceIdlFunc, balanceRes.reply.arg);
  const balance: bigint | undefined = fromNullable(decodedBalance);
  if (!balance) {
    return BigNumber(0);
  }

  return BigNumber(balance.toString());
};

export const fetchTxns = async (
  address: string,
  startBlockHeight: bigint,
  stopBlockHeight = BigInt(0),
): Promise<TransactionWithId[]> => {
  if (startBlockHeight <= stopBlockHeight) {
    return [];
  }

  const agent = await getAgent(ICP_NETWORK_URL);
  const canisterId = Principal.fromText(MAINNET_INDEX_CANISTER_ID);
  const transactionsRawRequest = {
    account_identifier: address,
    start: [startBlockHeight],
    max_results: BigInt(FETCH_TXNS_LIMIT),
  };

  const getTransactionsIdlFunc = getCanisterIdlFunc(
    indexIdlFactory,
    "get_account_identifier_transactions",
  );
  const getTransactionsArgs = encodeCanisterIdlFunc(getTransactionsIdlFunc, [
    transactionsRawRequest,
  ]);

  const transactionsRes = await agent.query(canisterId, {
    arg: getTransactionsArgs,
    methodName: "get_account_identifier_transactions",
  });

  invariant(transactionsRes.status === "replied", "[ICP](fetchTxns) Query failed");
  const decodedTransactions = decodeCanisterIdlFunc<
    [{ Ok: GetAccountIdentifierTransactionsResponse }]
  >(getTransactionsIdlFunc, transactionsRes.reply.arg);

  const response = fromNullable(decodedTransactions);
  invariant(response, "[ICP](fetchTxns) Decoding failed");

  if (response.Ok.transactions.length === 0) {
    return [];
  }

  const nextTxns = await fetchTxns(
    address,
    response.Ok.transactions.at(-1)?.id ?? BigInt(0),
    stopBlockHeight,
  );

  return [...response.Ok.transactions, ...nextTxns];
};
