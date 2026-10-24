import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { BlockNotFoundError, InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import { Address } from "@ton/core";
import chunk from "lodash/chunk";
import type { TonConfig, TonContext } from "../config";
import {
  fetchJettonTransfers,
  fetchMasterchainBlock,
  fetchMasterchainInfo,
  fetchTraces,
  fetchTransactions,
} from "../network";
import type {
  TonAddressBook,
  TonHistoryWindow,
  TonJettonTransferRow,
  TonMasterchainBlock,
  TonTrace,
  TonTraceNode,
  TonTransaction,
} from "../network/types";
import type { TonComment, TonOperationExtra } from "../types";
import { toFriendly, toJettonAsset, toOwnFriendly } from "./address";
import { type HistoryOrder, cutPage, parseCursor } from "./cursor";
import { decodeForwardPayload } from "./forwardPayload";

const DEFAULT_LIMIT = 256;
const MAX_LIMIT = 1000;
// The indexer times out on jetton pages of under 10 rows (measured 2026-10), so both sources are
// asked for at least twice that; the contract makes `limit` a soft bound.
const MIN_QUERY_LIMIT = 20;
// A transaction reaches its masterchain block after its own `utime`: 28 s at worst over 5000
// transactions sampled in 2024-2026. The window opens about ten times earlier than that.
const COMMIT_LAG_MARGIN_SECONDS = 300;
const TRACES_PER_REQUEST = 20;
const TRACE_REQUESTS_IN_FLIGHT = 3;

type TonMessage = NonNullable<TonTransaction["in_msg"]>;

/**
 * Native transactions and jetton transfers, merged by `utime` under one cursor (see `cutPage`).
 *
 * Neither endpoint filters by masterchain height, so `minHeight` opens the window at its block's
 * time minus the commit lag, and each row is then kept on its own masterchain block. A jetton row's
 * block is the one of the transaction that moved the jetton, read from its trace.
 */
export async function listOperations(
  context: TonContext,
  address: string,
  { minHeight, cursor, limit = DEFAULT_LIMIT, order = "desc" }: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new InvalidParameterError(`limit must be an integer between 1 and ${MAX_LIMIT} for TON`);
  }
  const config = await context.config();
  const owner = Address.parse(address);
  const from = parseCursor(cursor);
  const startUtime = minHeight > 0 ? await windowStart(config, minHeight) : undefined;

  const { transactions, transfers, addressBook, next } = await readPage(config, owner, order, {
    ...(order === "desc" ? { startUtime, endUtime: from } : { startUtime: from ?? startUtime }),
    limit: Math.max(limit, MIN_QUERY_LIMIT),
    sort: order,
  });

  const traces = await fetchTracesOf(config, transfers);
  const items = [
    ...transactions.flatMap(tx => nativeOperations(tx, owner, addressBook)),
    ...transfers.flatMap(row => jettonOperations(row, traces, owner, address, addressBook)),
  ]
    .filter(op => op.tx.block.height >= minHeight)
    .sort((a, b) =>
      order === "desc"
        ? b.tx.date.getTime() - a.tx.date.getTime()
        : a.tx.date.getTime() - b.tx.date.getTime(),
    );

  return { items, next: next?.toString() };
}

type HistorySlice = {
  transactions: TonTransaction[];
  transfers: TonJettonTransferRow[];
  addressBook: TonAddressBook;
};

async function fetchHistory(
  config: TonConfig,
  owner: Address,
  window: TonHistoryWindow,
): Promise<HistorySlice> {
  const [native, jetton] = await Promise.all([
    fetchTransactions(config, owner.toRawString(), window),
    fetchJettonTransfers(config, owner.toRawString(), window),
  ]);
  return {
    transactions: native.transactions,
    transfers: jetton.jetton_transfers,
    addressBook: { ...jetton.address_book, ...native.address_book },
  };
}

async function readPage(
  config: TonConfig,
  owner: Address,
  order: HistoryOrder,
  window: TonHistoryWindow,
): Promise<HistorySlice & { next: number | undefined }> {
  const page = await fetchHistory(config, owner, window);
  const cut = cutPage(order, [
    { utimes: page.transactions.map(tx => tx.now), full: page.transactions.length >= window.limit },
    {
      utimes: page.transfers.map(row => row.transaction_now),
      full: page.transfers.length >= window.limit,
    },
  ]);
  if ("crowdedSecond" in cut) return readSecond(config, owner, order, cut.crowdedSecond);

  return {
    transactions: page.transactions.slice(0, cut.consumed[0]),
    transfers: page.transfers.slice(0, cut.consumed[1]),
    addressBook: page.addressBook,
    next: cut.next,
  };
}

async function readSecond(
  config: TonConfig,
  owner: Address,
  order: HistoryOrder,
  utime: number,
): Promise<HistorySlice & { next: number }> {
  const second = await fetchHistory(config, owner, {
    startUtime: utime,
    endUtime: utime,
    limit: MAX_LIMIT,
    sort: order,
  });
  if (second.transactions.length >= MAX_LIMIT || second.transfers.length >= MAX_LIMIT) {
    throw new Error(
      `TON history of ${owner.toRawString()} holds over ${MAX_LIMIT} rows at ${utime}`,
    );
  }
  return { ...second, next: order === "desc" ? utime - 1 : utime + 1 };
}

async function windowStart(config: TonConfig, minHeight: number): Promise<number> {
  const block =
    (await fetchMasterchainBlock(config, minHeight)) ?? (await tipBelow(config, minHeight));
  return Math.max(0, Number(block.gen_utime) - COMMIT_LAG_MARGIN_SECONDS);
}

// `minHeight` is one past the tip whenever the newest stored operation sits in the tip block.
async function tipBelow(config: TonConfig, minHeight: number): Promise<TonMasterchainBlock> {
  const { last } = await fetchMasterchainInfo(config);
  if (last.seqno < minHeight) return last;
  const block = await fetchMasterchainBlock(config, minHeight);
  if (!block) throw new BlockNotFoundError(`TON masterchain block ${minHeight} not found`);
  return block;
}

async function fetchTracesOf(
  config: TonConfig,
  transfers: TonJettonTransferRow[],
): Promise<Map<string, TonTrace>> {
  const batches = chunk([...new Set(transfers.map(row => row.trace_id))], TRACES_PER_REQUEST);
  const traces = await promiseAllBatched(TRACE_REQUESTS_IN_FLIGHT, batches, batch =>
    fetchTraces(config, batch),
  );
  return new Map(traces.flat().map(trace => [trace.trace_id, trace]));
}

function details(comment: TonComment, lt: string, explorerHash: string): Record<string, unknown> {
  const familyExtra: TonOperationExtra = { comment, lt, explorerHash };
  return { ...(comment.text ? { memo: comment.text } : {}), familyExtra };
}

function messageComment(message: TonMessage | null | undefined): TonComment {
  const decoded = message?.message_content?.decoded;
  return {
    isEncrypted: decoded?.type === "binary_comment",
    text: decoded?.type === "text_comment" ? decoded.comment : "",
  };
}

const hasValue = (message: TonMessage): boolean => !!message.value && message.value !== "0";

// `total_fees` holds the action phase's share of the forwarding fees only: the rest travels in each
// message the account sends, and the account pays it all the same.
const forwardFees = (tx: TonTransaction): bigint =>
  tx.out_msgs
    .filter(message => message.source === tx.account)
    .reduce(
      (sum, message) => sum + BigInt(message.fwd_fee ?? 0) + BigInt(message.ihr_fee ?? 0),
      0n,
    );

/** The OUT value excludes the fee; the generic adapter adds it. */
function nativeOperations(
  tx: TonTransaction,
  owner: Address,
  addressBook: TonAddressBook,
): Operation[] {
  const height = tx.mc_block_seqno;
  if (height === null) throw new Error(`TON transaction ${tx.hash} has no masterchain block`);
  const hash = tx.in_msg?.hash ?? tx.hash;
  const date = new Date(tx.now * 1000);
  const ownAddress = toOwnFriendly(owner);
  const operation = (
    type: "IN" | "OUT",
    value: bigint,
    senders: string[],
    recipients: string[],
    comment: TonComment,
  ): Operation => ({
    id: `${hash}-${type}`,
    type,
    senders,
    recipients,
    value,
    asset: { type: "native" },
    details: details(comment, tx.lt, tx.hash),
    tx: {
      hash,
      block: { height, hash: "", time: date },
      fees: BigInt(tx.total_fees) + (type === "OUT" ? forwardFees(tx) : 0n),
      date,
      failed:
        tx.description.compute_ph.success === false && tx.description.compute_ph.exit_code !== 0,
    },
  });

  const operations: Operation[] = [];
  const inMessage = tx.in_msg;
  if (inMessage?.source && hasValue(inMessage) && inMessage.destination === tx.account) {
    operations.push(
      operation(
        "IN",
        BigInt(inMessage.value ?? 0),
        [toFriendly(inMessage.source, addressBook)],
        [ownAddress],
        messageComment(inMessage),
      ),
    );
  }

  const sent = tx.out_msgs.filter(message => message.source === tx.account && hasValue(message));
  if (sent.length > 0) {
    operations.push(
      operation(
        "OUT",
        sent.reduce((sum, message) => sum + BigInt(message.value ?? 0), 0n),
        [ownAddress],
        [
          ...new Set(
            sent.flatMap(message =>
              message.destination ? [toFriendly(message.destination, addressBook)] : [],
            ),
          ),
        ],
        messageComment(sent[0]),
      ),
    );
  }

  return operations;
}

/**
 * The jetton leg of a transfer: no fee of its own (the TON leg is the native row), and an
 * outgoing one carries the inbound message hash of the owner's wallet transaction, as the TON leg
 * does, so the two group together.
 */
function jettonOperations(
  row: TonJettonTransferRow,
  traces: Map<string, TonTrace>,
  owner: Address,
  holder: string,
  addressBook: TonAddressBook,
): Operation[] {
  const { height, ownerMessageHash } = locateInTrace(row, traces.get(row.trace_id), owner);
  const date = new Date(row.transaction_now * 1000);
  const ownAddress = toOwnFriendly(owner);
  const operation = (
    type: "IN" | "OUT",
    hash: string,
    senders: string[],
    recipients: string[],
  ): Operation => ({
    id: `${row.transaction_hash}-${type}`,
    type,
    senders,
    recipients,
    value: BigInt(row.amount),
    asset: toJettonAsset(row.jetton_master, holder),
    details: details(
      { isEncrypted: false, text: decodeForwardPayload(row.forward_payload) },
      row.transaction_lt,
      row.transaction_hash,
    ),
    tx: {
      hash,
      block: { height, hash: "", time: date },
      fees: 0n,
      date,
      failed: row.transaction_aborted,
    },
  });

  const operations: Operation[] = [];
  if (Address.parse(row.destination).equals(owner)) {
    operations.push(
      operation("IN", row.transaction_hash, [toFriendly(row.source, addressBook)], [ownAddress]),
    );
  }
  if (Address.parse(row.source).equals(owner)) {
    operations.push(
      operation(
        "OUT",
        ownerMessageHash ?? row.transaction_hash,
        [ownAddress],
        [toFriendly(row.destination, addressBook)],
      ),
    );
  }
  return operations;
}

function locateInTrace(
  row: TonJettonTransferRow,
  trace: TonTrace | undefined,
  owner: Address,
): { height: number; ownerMessageHash: string | undefined } {
  const event = trace?.transactions[row.transaction_hash];
  if (!trace || event?.mc_block_seqno === undefined || event.mc_block_seqno === null) {
    throw new Error(
      `TON trace ${row.trace_id} does not hold the committed transaction ${row.transaction_hash}`,
    );
  }
  const parent = findParent(trace.trace, row.transaction_hash);
  const parentAccount = parent && trace.transactions[parent.tx_hash]?.account;
  return {
    height: event.mc_block_seqno,
    ownerMessageHash:
      parent && parentAccount && Address.parse(parentAccount).equals(owner)
        ? parent.in_msg_hash
        : undefined,
  };
}

function findParent(root: TonTraceNode, txHash: string): TonTraceNode | undefined {
  const stack = [root];
  for (let node = stack.pop(); node; node = stack.pop()) {
    for (const child of node.children ?? []) {
      if (child.tx_hash === txHash) return node;
      stack.push(child);
    }
  }
  return undefined;
}
