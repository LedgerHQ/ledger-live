import {
  Cbor,
  Certificate,
  lookupResultToBuffer,
  ReadRequestType,
  requestIdOf,
  SubmitRequestType,
  type RequestId,
} from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  FETCH_TXNS_LIMIT,
  ICP_NETWORK_URL,
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAINNET_INDEX_CANISTER_ID,
  MAINNET_LEDGER_CANISTER_ID,
} from "../consts";
import { redactPrincipals } from "../common-logic/redact";
import {
  ICPCallRejected,
  ICPGovernanceRejected,
  ICPNodeRefused,
  ICPStakeNotRefreshed,
} from "../errors";
import { createIngressExpiry } from "../logic/buildTransaction";
import { getAgent } from "./agent";
import {
  archiveEncodedBlocksFunc,
  decodeCanisterIdlFunc,
  encodeCanisterIdlFunc,
  fromOpt,
  getCanisterIdlFunc,
  governanceIdlFactory,
  indexIdlFactory,
  ledgerIdlFactory,
} from "./candid";
import type {
  GetAccountIdentifierTransactionsResponse,
  TransactionWithId,
} from "./idl/index.types";
import type { ListNeuronsResponse, NeuronCommandOutcome } from "../types/neuron";

function requestIdFromHex(hex: string): RequestId {
  return new Uint8Array(Buffer.from(hex, "hex")) as RequestId;
}

// The IC root key is the trust anchor for BLS certificate verification. On mainnet the agent embeds
// the well-known key (the agent's IC_ROOT_KEY); only a local replica fetches it — from the replica
// itself, which is the trust boundary for local dev. It is deliberately NOT fetched from the boundary
// node whose replies we verify: doing so would let a compromised boundary supply both a forged
// certificate and a matching forged root, defeating certificate verification.
async function getRootKey(): Promise<Uint8Array> {
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

  const [decoded] = decodeCanisterIdlFunc<[{ chain_length: bigint }]>(
    queryBlocksIdlFunc,
    blockHeightRes.reply.arg,
  );
  invariant(decoded, "[ICP](fetchBlockHeight) Decoding failed");

  return BigNumber(decoded.chain_length.toString());
};

/**
 * Submit an envelope to the node and return the body it answered with, or `null` when it gave none.
 *
 * `null` is not a failure. A 202 means the node took the call but had no certificate for it within
 * its window; a 5xx that the answer was lost, the call possibly not. Either way the call can still
 * execute, and only a read of its status can say — the caller polls where it holds a signed
 * read-state envelope, and reports the outcome unknown where it does not. A 4xx to a call is the
 * one answer that settles it: the node never took the message. A 4xx to a read_state settles
 * nothing — the call it asks after was taken already, and the read itself may have expired (it
 * carries the call's expiry) or been rate-limited — so it counts as no answer, and the poll goes on.
 */
export const broadcastTxn = async (
  payload: Buffer,
  canisterId: string,
  type: "call" | "read_state",
): Promise<Uint8Array | null> => {
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
    const body = await res.arrayBuffer();
    return body.byteLength > 0 ? new Uint8Array(body) : null;
  }
  if (type === "call" && res.status >= 400 && res.status < 500) {
    const reason = redactPrincipals(await res.text());
    throw new ICPNodeRefused(`Failed to broadcast transaction: ${reason}`, {
      status: res.status,
      reason,
    });
  }
  return null;
};

/** The account's balance in e8s, or undefined when the index canister did not answer. */
export const queryBalance = async (address: string): Promise<bigint | undefined> => {
  const agent = await getAgent(ICP_NETWORK_URL);
  const indexCanister = Principal.fromText(MAINNET_INDEX_CANISTER_ID);
  const getBalanceIdlFunc = getCanisterIdlFunc(indexIdlFactory, "get_account_identifier_balance");
  const getBalanceArgs = encodeCanisterIdlFunc(getBalanceIdlFunc, [address]);

  const balanceRes = await agent.query(indexCanister, {
    arg: getBalanceArgs,
    methodName: "get_account_identifier_balance",
  });

  if (balanceRes.status !== "replied") {
    log("debug", `[ICP](queryBalance) Query failed: ${balanceRes.status}`);
    return undefined;
  }

  const [balance] = decodeCanisterIdlFunc<[bigint]>(getBalanceIdlFunc, balanceRes.reply.arg);
  return balance ?? 0n;
};

/**
 * The account's balance in e8s, read from the ledger itself, as a neuron refresh reads it. Unlike
 * {@link queryBalance}, it does not lag behind the ledger. Throws when the query is not answered.
 */
export const queryLedgerBalance = async (address: string): Promise<bigint> => {
  const agent = await getAgent(ICP_NETWORK_URL);
  const func = getCanisterIdlFunc(ledgerIdlFactory, "account_balance");
  const res = await agent.query(Principal.fromText(MAINNET_LEDGER_CANISTER_ID), {
    arg: encodeCanisterIdlFunc(func, [{ account: Buffer.from(address, "hex") }]),
    methodName: "account_balance",
  });
  invariant(res.status === "replied", "[ICP](queryLedgerBalance) Query failed");
  const [{ e8s }] = decodeCanisterIdlFunc<[{ e8s: bigint }]>(func, res.reply.arg);
  return e8s;
};

/**
 * The id of the neuron whose stake sits in governance subaccount `subaccount`, or undefined when no
 * neuron does. An anonymous `list_neurons` query naming the subaccount alone: governance answers
 * with the neuron's public information keyed by its id, and no full record. Throws when the query
 * is not answered, so no answer is never read as "no neuron".
 */
export const findNeuronIdBySubaccount = async (
  subaccount: Uint8Array,
): Promise<string | undefined> => {
  const agent = await getAgent(ICP_NETWORK_URL);
  const func = getCanisterIdlFunc(governanceIdlFactory, "list_neurons");
  const res = await agent.query(Principal.fromText(MAINNET_GOVERNANCE_CANISTER_ID), {
    arg: encodeCanisterIdlFunc(func, [
      {
        neuron_ids: [],
        neuron_subaccounts: [[{ subaccount }]],
        include_neurons_readable_by_caller: false,
        include_empty_neurons_readable_by_caller: [],
        include_public_neurons_in_full_neurons: [],
        page_number: [],
        page_size: [],
      },
    ]),
    methodName: "list_neurons",
  });
  invariant(res.status === "replied", "[ICP](findNeuronIdBySubaccount) Query failed");
  const [{ neuron_infos }] = decodeCanisterIdlFunc<[{ neuron_infos: [bigint, unknown][] }]>(
    func,
    res.reply.arg,
  );
  const [entry] = neuron_infos;
  return entry === undefined ? undefined : entry[0].toString();
};

// The account bridge reads an unanswered balance query as 0 rather than failing the sync.
export const fetchBalance = async (address: string): Promise<BigNumber> =>
  BigNumber(((await queryBalance(address)) ?? 0n).toString());

export interface TxnsPage {
  /** Newest first. */
  transactions: TransactionWithId[];
  /** Id of the account's oldest transaction, absent when it has none. */
  oldestTxId: bigint | undefined;
}

/**
 * One page of the account's history from the index canister, newest first. `start` is exclusive:
 * the page begins with the newest transaction older than it, or with the newest one when absent.
 */
export const fetchTxnsPage = async (
  address: string,
  start: bigint | undefined,
  maxResults: number = FETCH_TXNS_LIMIT,
): Promise<TxnsPage> => {
  const agent = await getAgent(ICP_NETWORK_URL);
  const canisterId = Principal.fromText(MAINNET_INDEX_CANISTER_ID);
  const transactionsRawRequest = {
    account_identifier: address,
    start: start === undefined ? [] : [start],
    max_results: BigInt(maxResults),
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

  invariant(transactionsRes.status === "replied", "[ICP](fetchTxnsPage) Query failed");
  const [response] = decodeCanisterIdlFunc<
    [{ Ok?: GetAccountIdentifierTransactionsResponse; Err?: { message: string } }]
  >(getTransactionsIdlFunc, transactionsRes.reply.arg);
  invariant(response, "[ICP](fetchTxnsPage) Decoding failed");
  invariant(response.Ok, `[ICP](fetchTxnsPage) Index refused the query: ${response.Err?.message}`);

  return {
    transactions: response.Ok.transactions,
    oldestTxId: response.Ok.oldest_tx_id ? fromOpt(response.Ok.oldest_tx_id) : undefined,
  };
};

export const fetchTxns = async (
  address: string,
  startBlockHeight: bigint,
  stopBlockHeight = BigInt(0),
): Promise<TransactionWithId[]> => {
  if (startBlockHeight <= stopBlockHeight) {
    return [];
  }

  const { transactions } = await fetchTxnsPage(address, startBlockHeight);
  if (transactions.length === 0) {
    return [];
  }

  const nextTxns = await fetchTxns(address, transactions.at(-1)?.id ?? BigInt(0), stopBlockHeight);

  return [...transactions, ...nextTxns];
};

interface QueryEncodedBlocksResponse {
  blocks: Uint8Array[];
  chain_length: bigint;
  archived_blocks: { start: bigint; length: bigint; callback: [Principal, string] }[];
}

/**
 * The protobuf-encoded block at `height`, or undefined above the chain tip. The ledger holds only
 * its most recent blocks; for an older one it answers with the archive canister that holds it,
 * which is queried in turn.
 */
export const fetchEncodedBlock = async (height: bigint): Promise<Uint8Array | undefined> => {
  const agent = await getAgent(ICP_NETWORK_URL);
  const ledgerCanister = Principal.fromText(MAINNET_LEDGER_CANISTER_ID);
  const queryIdlFunc = getCanisterIdlFunc(ledgerIdlFactory, "query_encoded_blocks");
  const args = { start: height, length: BigInt(1) };

  const res = await agent.query(ledgerCanister, {
    arg: encodeCanisterIdlFunc(queryIdlFunc, [args]),
    methodName: "query_encoded_blocks",
  });
  invariant(res.status === "replied", "[ICP](fetchEncodedBlock) Query failed");
  const [response] = decodeCanisterIdlFunc<[QueryEncodedBlocksResponse]>(
    queryIdlFunc,
    res.reply.arg,
  );
  invariant(response, "[ICP](fetchEncodedBlock) Decoding failed");

  if (response.blocks.length > 0) return response.blocks[0];

  const archive = response.archived_blocks.find(
    range => range.start <= height && height < range.start + range.length,
  );
  if (!archive) return undefined;

  const [archiveCanister, archiveMethod] = archive.callback;
  const archiveRes = await agent.query(archiveCanister, {
    arg: encodeCanisterIdlFunc(archiveEncodedBlocksFunc, [args]),
    methodName: archiveMethod,
  });
  invariant(archiveRes.status === "replied", "[ICP](fetchEncodedBlock) Archive query failed");
  const [archived] = decodeCanisterIdlFunc<[{ Ok?: Uint8Array[]; Err?: unknown }]>(
    archiveEncodedBlocksFunc,
    archiveRes.reply.arg,
  );
  invariant(archived?.Ok, "[ICP](fetchEncodedBlock) Archive refused the query");
  return archived.Ok[0];
};

// ICP update calls finalize in a few seconds; poll well past that so an indeterminate result is an
// outage-only rarity rather than a routine timeout.
const READ_STATE_POLL_ATTEMPTS = 20;
const READ_STATE_POLL_INTERVAL_MS = 1000;
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// The terminal reply from a status certificate, or null while the request is still non-terminal
// (received / processing / not yet in the tree). Throws only on an explicit `rejected` status.
const terminalReply = async (
  certificate: Uint8Array,
  canisterId: Principal,
  requestId: RequestId,
  rootKey: Uint8Array,
): Promise<Uint8Array | null> => {
  const cert = await Certificate.create({
    certificate,
    rootKey,
    principal: { canisterId },
    maxAgeInMinutes: 100,
  });
  const statusBuf = lookupResultToBuffer(cert.lookup_path(["request_status", requestId, "status"]));
  const status = statusBuf ? new TextDecoder().decode(statusBuf) : undefined;
  if (status === "rejected") {
    const rejectBuf = lookupResultToBuffer(
      cert.lookup_path(["request_status", requestId, "reject_message"]),
    );
    const reason = redactPrincipals(rejectBuf ? new TextDecoder().decode(rejectBuf) : "");
    throw new ICPCallRejected(`[ICP] call rejected: ${reason || "unknown"}`, { reason });
  }
  return status === "replied"
    ? (lookupResultToBuffer(cert.lookup_path(["request_status", requestId, "reply"])) ?? null)
    : null;
};

// What the synchronous /call answers with when it answers at all: a certificate for the request's
// status, or — for a call the node turned away before replication — the rejection itself.
interface SyncCallBody {
  status?: string;
  certificate?: Uint8Array;
  reject_message?: string;
}

// A call refused before replication never ran, exactly like one a certificate marks `rejected`, and
// is reported the same way. Left unrecognized it reads as a call with no certificate yet, and gets
// polled for a status it will never have — then reported as an outcome unknown.
const throwIfRejectedBeforeReplication = (body: SyncCallBody): void => {
  if (body.status !== "non_replicated_rejection") return;
  const reason = redactPrincipals(body.reject_message ?? "");
  throw new ICPCallRejected(`[ICP] call rejected: ${reason || "unknown"}`, { reason });
};

/**
 * Submit a signed update call and return its reply. The v3 `/call` endpoint may answer synchronously
 * with the terminal certificate, or with none at all; otherwise we poll the signed read-state
 * envelope with bounded backoff until `replied` or `rejected`. Throws on a rejected call. Returns null (indeterminate) if
 * no terminal status arrives within the window; the caller decides how to handle it — idempotent
 * reads/claims may retry, non-idempotent governance ops must surface it as unconfirmed (not success).
 */
export const readReplyFromCanister = async (
  callBlob: Buffer,
  readStateBlob: Buffer | undefined,
  canisterIdStr: string,
  requestIdHex: string,
): Promise<Uint8Array | null> => {
  const canisterId = Principal.fromText(canisterIdStr);
  const requestId = requestIdFromHex(requestIdHex);
  const rootKey = await getRootKey();

  const callRes = await broadcastTxn(callBlob, canisterIdStr, "call");
  if (callRes) {
    const top = Cbor.decode<SyncCallBody>(callRes);
    throwIfRejectedBeforeReplication(top);
    if (top.certificate) {
      const reply = await terminalReply(top.certificate, canisterId, requestId, rootKey);
      if (reply) return reply;
    }
  }

  // Poll the same request id via read-state until terminal, or give up (indeterminate). Reached
  // with no answer at all when the node took the call but could not certify it in time.
  if (!readStateBlob) return null;
  for (let attempt = 0; attempt < READ_STATE_POLL_ATTEMPTS; attempt += 1) {
    await delay(READ_STATE_POLL_INTERVAL_MS);
    const readStateRes = await broadcastTxn(readStateBlob, canisterIdStr, "read_state");
    if (!readStateRes) continue;
    const { certificate } = Cbor.decode<{ certificate?: Uint8Array }>(readStateRes);
    if (!certificate) continue;
    const reply = await terminalReply(certificate, canisterId, requestId, rootKey);
    if (reply) return reply;
  }
  return null;
};

/** The ledger's reply to a transfer: the block it landed in, or the refusal it explains. */
export interface LedgerTransferOutcome {
  Ok?: unknown;
  Err?: unknown;
}

/**
 * Read the ledger's verdict on a transfer out of what the synchronous call answered with.
 *
 * Throws ICPCallRejected when that answer says the call never ran — the node turned it away before
 * replication, or the replica rejected it — and a plain error when it cannot be read: a body that
 * does not decode, a certificate that does not verify, a status that is not terminal. Whether an
 * unreadable answer is a failure or an outcome unknown is the caller's to say; it knows what the
 * transfer was for.
 */
export const readTransferOutcome = async (
  syncCallResponse: Uint8Array,
  transferRequestIdHex: string,
): Promise<LedgerTransferOutcome> => {
  const requestId = requestIdFromHex(transferRequestIdHex);
  const canisterId = Principal.fromText(MAINNET_LEDGER_CANISTER_ID);
  const top = Cbor.decode<SyncCallBody>(syncCallResponse);
  throwIfRejectedBeforeReplication(top);
  invariant(
    top.status === "replied" && top.certificate,
    "[ICP](readTransferOutcome) Decoding failed",
  );

  const reply = await terminalReply(top.certificate, canisterId, requestId, await getRootKey());
  invariant(reply, "[ICP](readTransferOutcome) Reply status not found");

  const transferIdlFunc = getCanisterIdlFunc(ledgerIdlFactory, "transfer");
  const [outcome] = decodeCanisterIdlFunc<[LedgerTransferOutcome]>(transferIdlFunc, reply);
  return outcome;
};

/** The ledger ran the transfer and refused it: nothing moved, and the message carries its reason. */
export const throwIfLedgerTransferRefused = (outcome: LedgerTransferOutcome): void => {
  if (!outcome.Err) return;
  throw new Error(
    JSON.stringify(outcome.Err, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
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
    arg,
    canister_id: Principal.fromText(MAINNET_GOVERNANCE_CANISTER_ID),
    ingress_expiry: createIngressExpiry(),
    method_name: "claim_or_refresh_neuron_from_account",
    request_type: SubmitRequestType.Call,
    sender: Principal.anonymous(),
  };
  const requestId = requestIdOf(content);
  const requestIdHex = Buffer.from(requestId).toString("hex");
  // Companion read-state envelope so the call can be polled to a terminal status (anonymous, no sig).
  const readStateContent = {
    ingress_expiry: content.ingress_expiry,
    paths: [[new TextEncoder().encode("request_status"), new Uint8Array(requestId)]],
    request_type: ReadRequestType.ReadState,
    sender: content.sender,
  };
  // The claim only ever runs after the transfer settled, so a rejected claim call leaves the same
  // state as one governance answered with an error: the ICP is in the neuron's account, unclaimed.
  // It is reported as that rather than as a rejected call, which reads as "nothing ran" — true of
  // the claim, false of the transfer, and what would get the user offered a retry that stakes twice.
  let reply: Uint8Array | null;
  try {
    reply = await readReplyFromCanister(
      Buffer.from(Cbor.encode({ content })),
      Buffer.from(Cbor.encode({ content: readStateContent })),
      MAINNET_GOVERNANCE_CANISTER_ID,
      requestIdHex,
    );
  } catch (error) {
    if (!(error instanceof ICPCallRejected)) throw error;
    const reason = typeof error.reason === "string" ? error.reason : "";
    throw new ICPStakeNotRefreshed(reason || "ICPStakeNotRefreshed", { reason });
  }
  // Indeterminate (outage only, after polling): the caller decides — a create/top-up surfaces it as
  // unconfirmed rather than reporting success (the transfer already happened).
  if (!reply) return undefined;

  const decoded = decodeCanisterIdlFunc<
    [{ result: [] | [{ NeuronId?: { id: bigint }; Error?: { error_message: string } }] }]
  >(func, reply);
  const result = fromOpt(decoded[0].result);
  if (result && "Error" in result && result.Error) {
    // The transfer has settled by now, so this is not a failed transaction: the ICP sits in the
    // neuron's account, and the reason says what stopped the claim or refresh.
    const reason = redactPrincipals(result.Error.error_message ?? "");
    throw new ICPStakeNotRefreshed(reason || "ICPStakeNotRefreshed", { reason });
  }
  return result && "NeuronId" in result ? result.NeuronId?.id : undefined;
};

/**
 * Decode a manage_neuron reply: throw the governance error if the command failed, otherwise return
 * whatever the command reported about its own result.
 *
 * StakeMaturity is the only command read out today, because it is the only one in the flow whose
 * outcome the canister computes *and* hands straight back. Reproducing it locally would mean
 * re-deriving the split from a percentage of a maturity figure that may have accrued since the last
 * snapshot; the reply states both totals outright.
 */
export const decodeManageNeuronReply = (reply: Uint8Array): NeuronCommandOutcome | undefined => {
  const func = getCanisterIdlFunc(governanceIdlFactory, "manage_neuron");
  const [decoded] = decodeCanisterIdlFunc<
    [
      {
        command:
          | []
          | [
              {
                Error?: { error_message: string };
                StakeMaturity?: { maturity_e8s: bigint; staked_maturity_e8s: bigint };
              },
            ];
      },
    ]
  >(func, reply);
  const command = fromOpt(decoded.command);
  if (command && "Error" in command && command.Error) {
    // Named rather than a bare Error: `errors.<name>` is how the apps translate this, and the
    // canister's own text rides along as `reason` for the copy to quote — minus the caller, which
    // several of these messages name and which the error carries into crash reporting.
    const reason = redactPrincipals(command.Error.error_message ?? "");
    throw new ICPGovernanceRejected(reason || "ICPGovernanceRejected", { reason });
  }
  const staked = command && "StakeMaturity" in command ? command.StakeMaturity : undefined;
  return staked
    ? {
        maturityE8s: staked.maturity_e8s.toString(),
        stakedMaturityE8s: staked.staked_maturity_e8s.toString(),
      }
    : undefined;
};

/** Decode a list_neurons reply into the raw neuron snapshot. */
export const decodeListNeuronsReply = (reply: Uint8Array): ListNeuronsResponse => {
  const func = getCanisterIdlFunc(governanceIdlFactory, "list_neurons");
  const [decoded] = decodeCanisterIdlFunc<[ListNeuronsResponse]>(func, reply);
  return decoded;
};
