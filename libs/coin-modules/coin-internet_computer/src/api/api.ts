import {
  Cbor,
  Certificate,
  Expiry,
  lookupResultToBuffer,
  requestIdOf,
  SubmitRequestType,
  type RequestId,
} from "@dfinity/agent";
import type {
  GetAccountIdentifierTransactionsResponse,
  TransactionWithId,
} from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import { fromNullable } from "@dfinity/utils";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS,
  FETCH_TXNS_LIMIT,
  ICP_NETWORK_URL,
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAINNET_INDEX_CANISTER_ID,
  MAINNET_LEDGER_CANISTER_ID,
} from "../consts";
import { redactPrincipals } from "../common-logic/redact";
import { ICPCallRejected, ICPGovernanceRejected } from "../errors";
import { getAgent } from "../network/agent";
import {
  decodeCanisterIdlFunc,
  encodeCanisterIdlFunc,
  getCanisterIdlFunc,
  governanceIdlFactory,
  indexIdlFactory,
  ledgerIdlFactory,
} from "../network/candid";
import type { ListNeuronsResponse } from "../types/neuron";

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

// The IC root key is the trust anchor for BLS certificate verification. On mainnet the agent embeds
// the well-known key (@dfinity/agent's IC_ROOT_KEY); only a local replica fetches it — from the replica
// itself, which is the trust boundary for local dev. It is deliberately NOT fetched from the boundary
// node whose replies we verify: doing so would let a compromised boundary supply both a forged
// certificate and a matching forged root, defeating certificate verification.
async function getRootKey(): Promise<ArrayBuffer> {
  const agent = await getAgent(ICP_NETWORK_URL);
  invariant(agent.rootKey, "[ICP](getRootKey) Root key unavailable");
  return agent.rootKey;
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
  // The IC serves the synchronous call on v3 but read_state only on v2 (there is no v3 read_state).
  const version = type === "read_state" ? "v2" : "v3";
  const res = await fetch(`${ICP_NETWORK_URL}/api/${version}/canister/${canisterId}/${type}`, {
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

  const rootKey = await getRootKey();
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

// ICP update calls finalize in a few seconds; poll well past that so an indeterminate result is an
// outage-only rarity rather than a routine timeout.
const READ_STATE_POLL_ATTEMPTS = 20;
const READ_STATE_POLL_INTERVAL_MS = 1000;
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// The terminal reply from a status certificate, or null while the request is still non-terminal
// (received / processing / not yet in the tree). Throws only on an explicit `rejected` status.
const terminalReply = async (
  certificate: ArrayBuffer | Uint8Array,
  canisterId: Principal,
  requestId: RequestId,
  rootKey: ArrayBuffer,
): Promise<ArrayBuffer | null> => {
  const cert = await Certificate.create({
    certificate: toArrayBuffer(certificate),
    rootKey,
    canisterId,
    maxAgeInMinutes: 100,
  });
  const statusBuf = lookupResultToBuffer(cert.lookup(["request_status", requestId, "status"]));
  const status = statusBuf ? new TextDecoder().decode(statusBuf) : undefined;
  if (status === "rejected") {
    const rejectBuf = lookupResultToBuffer(
      cert.lookup(["request_status", requestId, "reject_message"]),
    );
    const reason = redactPrincipals(rejectBuf ? new TextDecoder().decode(rejectBuf) : "");
    throw new ICPCallRejected(`[ICP] call rejected: ${reason || "unknown"}`, { reason });
  }
  return status === "replied"
    ? (lookupResultToBuffer(cert.lookup(["request_status", requestId, "reply"])) ?? null)
    : null;
};

/**
 * Submit a signed update call and return its reply. The v3 `/call` endpoint may answer synchronously
 * with the terminal certificate; otherwise we poll the signed read-state envelope with bounded
 * backoff until `replied` or `rejected`. Throws on a rejected call. Returns null (indeterminate) if
 * no terminal status arrives within the window; the caller decides how to handle it — idempotent
 * reads/claims may retry, non-idempotent governance ops must surface it as unconfirmed (not success).
 */
export const readReplyFromCanister = async (
  callBlob: Buffer,
  readStateBlob: Buffer | undefined,
  canisterIdStr: string,
  requestIdHex: string,
): Promise<ArrayBuffer | null> => {
  const canisterId = Principal.fromText(canisterIdStr);
  const requestId = requestIdFromHex(requestIdHex);
  const rootKey = await getRootKey();

  const callRes = await broadcastTxn(callBlob, canisterIdStr, "call");
  const top = Cbor.decode<{ status?: string; certificate?: ArrayBuffer | Uint8Array }>(
    toArrayBuffer(callRes),
  );
  if (top.certificate) {
    const reply = await terminalReply(top.certificate, canisterId, requestId, rootKey);
    if (reply) return reply;
  }

  // Poll the same request id via read-state until terminal, or give up (indeterminate).
  if (!readStateBlob) return null;
  for (let attempt = 0; attempt < READ_STATE_POLL_ATTEMPTS; attempt += 1) {
    await delay(READ_STATE_POLL_INTERVAL_MS);
    const readStateRes = await broadcastTxn(readStateBlob, canisterIdStr, "read_state");
    const { certificate } = Cbor.decode<{ certificate: ArrayBuffer | Uint8Array }>(
      toArrayBuffer(readStateRes),
    );
    if (!certificate) continue;
    const reply = await terminalReply(certificate, canisterId, requestId, rootKey);
    if (reply) return reply;
  }
  return null;
};

/**
 * Claim or refresh a neuron from a completed stake transfer. Permissionless (no signature) — the
 * governance canister recomputes the neuron subaccount from `controller` + `memo` and creates the
 * neuron if absent, or refreshes its cached stake if it already exists. Idempotent, so it is safe to
 * retry after a transfer that succeeded but whose claim timed out. Returns the neuron id.
 */
export const claimOrRefreshNeuronFromAccount = async (
  controller: Principal,
  memo: bigint,
): Promise<bigint | undefined> => {
  const func = getCanisterIdlFunc(governanceIdlFactory, "claim_or_refresh_neuron_from_account");
  const arg = encodeCanisterIdlFunc(func, [{ controller: [controller], memo }]);
  const content = {
    request_type: SubmitRequestType.Call,
    canister_id: Principal.fromText(MAINNET_GOVERNANCE_CANISTER_ID),
    method_name: "claim_or_refresh_neuron_from_account",
    arg,
    sender: Principal.anonymous(),
    ingress_expiry: new Expiry(DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS),
  };
  const requestId = requestIdOf(content);
  const requestIdHex = Buffer.from(requestId).toString("hex");
  // Companion read-state envelope so the call can be polled to a terminal status (anonymous, no sig).
  const readStateContent = {
    request_type: "read_state",
    paths: [[new TextEncoder().encode("request_status"), new Uint8Array(requestId)]],
    sender: content.sender,
    ingress_expiry: content.ingress_expiry,
  };
  const reply = await readReplyFromCanister(
    Buffer.from(Cbor.encode({ content })),
    Buffer.from(Cbor.encode({ content: readStateContent })),
    MAINNET_GOVERNANCE_CANISTER_ID,
    requestIdHex,
  );
  // Indeterminate (outage only, after polling): the caller decides — a create/top-up surfaces it as
  // unconfirmed rather than reporting success (the transfer already happened).
  if (!reply) return undefined;

  const decoded = decodeCanisterIdlFunc<
    [{ result: [] | [{ NeuronId?: { id: bigint }; Error?: { error_message: string } }] }]
  >(func, reply);
  const result = fromNullable(decoded[0].result);
  if (result && "Error" in result && result.Error) throw new Error(result.Error.error_message);
  return result && "NeuronId" in result ? result.NeuronId?.id : undefined;
};

/** Decode a manage_neuron reply, throwing the governance error message if the command failed. */
export const decodeManageNeuronReply = (reply: ArrayBuffer): void => {
  const func = getCanisterIdlFunc(governanceIdlFactory, "manage_neuron");
  const [decoded] = decodeCanisterIdlFunc<
    [{ command: [] | [{ Error?: { error_message: string } }] }]
  >(func, reply);
  const command = fromNullable(decoded.command);
  if (command && "Error" in command && command.Error) {
    // Named rather than a bare Error: `errors.<name>` is how the apps translate this, and the
    // canister's own text rides along as `reason` for the copy to quote — minus the caller, which
    // several of these messages name and which the error carries into crash reporting.
    const reason = redactPrincipals(command.Error.error_message ?? "");
    throw new ICPGovernanceRejected(reason || "ICPGovernanceRejected", { reason });
  }
};

/** Decode a list_neurons reply into the raw neuron snapshot. */
export const decodeListNeuronsReply = (reply: ArrayBuffer): ListNeuronsResponse => {
  const func = getCanisterIdlFunc(governanceIdlFactory, "list_neurons");
  const [decoded] = decodeCanisterIdlFunc<[ListNeuronsResponse]>(func, reply);
  return decoded;
};
