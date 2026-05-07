import type { RequestId } from "@dfinity/agent";
import { log } from "@ledgerhq/logs";
import {
  ledgerIdlFactory,
  indexIdlFactory,
  getCanisterIdlFunc,
  Principal,
  encodeCanisterIdlFunc,
  decodeCanisterIdlFunc,
  GetAccountIdentifierTransactionsResponse,
  TransactionWithId,
} from "@zondax/ledger-live-icp";
import { Certificate, Cbor, getAgent, lookupResultToBuffer } from "@zondax/ledger-live-icp/agent";
import { fromNullable } from "@zondax/ledger-live-icp/utils";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  FETCH_TXNS_LIMIT,
  MAINNET_INDEX_CANISTER_ID,
  MAINNET_LEDGER_CANISTER_ID,
  ICP_NETWORK_URL,
} from "../consts";

function toArrayBuffer(view: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (view instanceof ArrayBuffer) {
    return view;
  }
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

function requestIdFromHex(hex: string): RequestId {
  const bytes = Buffer.from(hex, "hex");
  const copy = new Uint8Array(bytes);
  return copy.buffer as RequestId;
}

function throwIfLedgerTransferReplyIsErr(replyBuf: ArrayBuffer) {
  const transferIdlFunc = getCanisterIdlFunc(ledgerIdlFactory, "transfer");
  const decoded = decodeCanisterIdlFunc<[{ Err?: unknown; Ok?: unknown }]>(
    transferIdlFunc,
    replyBuf,
  );

  const out = decoded[0];
  if (out.Err) {
    const message = JSON.stringify(out.Err, (_, v) => (typeof v === "bigint" ? v.toString() : v));
    throw new Error(message);
  }
}

async function fetchRootKey(): Promise<ArrayBuffer> {
  const res = await fetch(`${ICP_NETWORK_URL}/api/v2/status`);
  if (res.status !== 200) {
    throw new Error(`Failed to fetch status: ${await res.text()}`);
  }

  const status = Cbor.decode<{ root_key?: ArrayBuffer | Uint8Array }>(await res.arrayBuffer());
  invariant(status.root_key, "[ICP](fetchRootKey) Missing root_key in status response");

  return toArrayBuffer(status.root_key);
}

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
    body: payload as unknown as BodyInit,
    method: "POST",
    headers: {
      "Content-Type": "application/cbor",
    },
  });

  if (res.status === 200) {
    return new Uint8Array(await res.arrayBuffer());
  }

  throw new Error(`Failed to broadcast transaction: ${await res.text()}`);
};

export const ensureTransferCallAccepted = async (
  syncCallResponse: Uint8Array,
  transferRequestIdHex: string,
) => {
  const requestId = requestIdFromHex(transferRequestIdHex);
  const canisterId = Principal.fromText(MAINNET_LEDGER_CANISTER_ID);
  const top = Cbor.decode<{
    status?: string;
    certificate?: ArrayBuffer | Uint8Array;
  }>(toArrayBuffer(syncCallResponse));

  invariant(
    top.status === "replied" && top.certificate,
    "[ICP](ensureTransferCallAccepted) Decoding failed",
  );

  const rootKey = await fetchRootKey();
  const cert = await Certificate.create({
    certificate: toArrayBuffer(top.certificate),
    rootKey,
    canisterId,
    maxAgeInMinutes: 100,
  });
  const replyBuf = lookupResultToBuffer(cert.lookup(["request_status", requestId, "reply"]));

  invariant(replyBuf, "[ICP](ensureTransferCallAccepted) Reply status not found");

  throwIfLedgerTransferReplyIsErr(replyBuf);
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
