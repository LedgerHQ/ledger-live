import type {
  AleoPublicTransaction,
  AleoPublicTransactionsResponse,
} from "@ledgerhq/coin-aleo/types";
import type {
  DevnodeBlock,
  DevnodeConfirmedTransaction,
  DevnodeTransaction,
  DevnodeTransition,
} from "../devnode";
import { getBlocksFrom, parseFutureSender } from "../devnode";
import { INDEXED_PROGRAMS, SENDER_ABSENT_FROM_FUTURE } from "./programs";
import { isSponsorTransaction } from "./sponsor";

function parseUnsignedLiteral(literal: string, suffix: "u64" | "u128", field: string): number {
  const match = new RegExp(`^(\\d+)${suffix}$`).exec(literal.trim());
  if (!match) {
    throw new Error(`aleo coin-tester: could not read ${field} from '${literal}'`);
  }
  return Number(match[1]);
}

export function parseFee(transaction: DevnodeTransaction): number {
  const feeTransition = transaction.fee?.transition;
  if (!feeTransition) {
    throw new Error(`aleo coin-tester: transaction ${transaction.id} carries no fee`);
  }
  const spentRecordOffset = feeTransition.function === "fee_private" ? 1 : 0;
  const base = feeTransition.inputs[spentRecordOffset];
  const priority = feeTransition.inputs[spentRecordOffset + 1];
  if (!base?.value || !priority?.value) {
    throw new Error(
      `aleo coin-tester: fee transition ${feeTransition.id} does not expose its fee inputs`,
    );
  }
  return (
    parseUnsignedLiteral(base.value, "u64", "base fee") +
    parseUnsignedLiteral(priority.value, "u64", "priority fee")
  );
}

// snarkVM stores a rejected execution as a fee transaction; its transitions move to `rejected.execution`.
type DevnodeRejected = {
  type: string;
  execution?: { transitions: DevnodeTransition[] };
};

type DevnodeConfirmedTransactionWithRejection = DevnodeConfirmedTransaction & {
  rejected?: DevnodeRejected;
};

const TRANSACTION_STATUS_BY_DEVNODE_STATUS: Record<string, string> = {
  accepted: "Accepted",
  rejected: "Rejected",
};

function indexableTransitions(
  confirmed: DevnodeConfirmedTransactionWithRejection,
): DevnodeTransition[] {
  const accepted = confirmed.transaction.execution?.transitions;
  if (accepted) return accepted;

  const rejected = confirmed.rejected;
  if (rejected?.type === "execution") return rejected.execution?.transitions ?? [];

  return [];
}

function readSender(
  transition: DevnodeTransition,
  senderArgIndex: number | typeof SENDER_ABSENT_FROM_FUTURE,
): string {
  // The real indexer publishes "" when the future names no caller.
  if (senderArgIndex === SENDER_ABSENT_FROM_FUTURE) return "";
  return parseFutureSender(transition, senderArgIndex);
}

function toRow({
  block,
  confirmed,
  transition,
}: {
  block: DevnodeBlock;
  confirmed: DevnodeConfirmedTransaction;
  transition: DevnodeTransition;
}): AleoPublicTransaction {
  const transactionStatus = TRANSACTION_STATUS_BY_DEVNODE_STATUS[confirmed.status];
  if (!transactionStatus) {
    throw new Error(
      `aleo coin-tester: cannot map ${transition.program}/${transition.function} with status '${confirmed.status}'`,
    );
  }

  const descriptor = INDEXED_PROGRAMS[transition.program]?.[transition.function];
  if (!descriptor) {
    throw new Error(
      `aleo coin-tester: no INDEXED_PROGRAMS descriptor for ${transition.program}/${transition.function}`,
    );
  }

  const recipient = transition.inputs[descriptor.recipientInputIndex];
  const amount = transition.inputs[descriptor.amountInputIndex];
  if (!recipient?.value || !amount?.value) {
    throw new Error(
      `aleo coin-tester: transition ${transition.id} does not expose its transfer inputs`,
    );
  }

  const sender = readSender(transition, descriptor.senderArgIndex);

  return {
    // For a rejected execution: the stored fee transaction's id, not the broadcast one.
    transaction_id: confirmed.transaction.id,
    transition_id: transition.id,
    transaction_status: transactionStatus,
    block_number: block.header.metadata.height,
    block_hash: block.block_hash,
    block_timestamp: String(block.header.metadata.timestamp),
    function_id: transition.function,
    amount: parseUnsignedLiteral(amount.value, descriptor.amountSuffix, "amount"),
    sender_address: sender,
    recipient_address: recipient.value.trim(),
    program_id: transition.program,
    fee: parseFee(confirmed.transaction),
  };
}

export async function scanIndexedTransfers(): Promise<AleoPublicTransaction[]> {
  const rows: AleoPublicTransaction[] = [];

  for (const block of await getBlocksFrom(0)) {
    for (const confirmed of (block.transactions ??
      []) as DevnodeConfirmedTransactionWithRejection[]) {
      // A real fee master leaves no transfer in the user's history.
      if (isSponsorTransaction(confirmed.transaction.id)) continue;
      for (const transition of indexableTransitions(confirmed)) {
        if (!INDEXED_PROGRAMS[transition.program]?.[transition.function]) continue;
        rows.push(toRow({ block, confirmed, transition }));
      }
    }
  }

  return rows;
}

export async function getAccountTransactionRows(address: string): Promise<AleoPublicTransaction[]> {
  const rows = await scanIndexedTransfers();
  return rows
    .filter(row => row.sender_address === address || row.recipient_address === address)
    .sort((a, b) => a.block_number - b.block_number);
}

export type TransactionsCursor = {
  blockNumber?: number;
  transitionId?: string;
  order: "asc" | "desc";
};

export function readTransactionsCursor(query: URLSearchParams): TransactionsCursor {
  const blockNumber = query.get("cursor_block_number");
  const transitionId = query.get("cursor_transition_id");
  return {
    ...(blockNumber !== null && { blockNumber: Number(blockNumber) }),
    ...(transitionId && { transitionId }),
    order: query.get("sort") === "desc" ? "desc" : "asc",
  };
}

/** Like production: a block number alone skips that whole block, a transition id resumes inside it. */
export function applyTransactionsCursor(
  rows: AleoPublicTransaction[],
  { blockNumber, transitionId, order }: TransactionsCursor,
): AleoPublicTransaction[] {
  const ordered = order === "asc" ? rows : [...rows].reverse();
  if (blockNumber === undefined) return ordered;

  if (transitionId) {
    const index = ordered.findIndex(row => row.transition_id === transitionId);
    if (index !== -1) return ordered.slice(index + 1);
  }

  return ordered.filter(row =>
    order === "asc" ? row.block_number > blockNumber : row.block_number < blockNumber,
  );
}

const DEFAULT_PAGE_SIZE = 50;

/** Serves at most `maxPageSize` rows, below the requested `limit`, so a sync can be forced across pages. */
export function pageTransactions(
  address: string,
  rows: AleoPublicTransaction[],
  query: URLSearchParams,
  maxPageSize = Infinity,
): AleoPublicTransactionsResponse {
  const pageSize = Math.min(Number(query.get("limit") ?? DEFAULT_PAGE_SIZE), maxPageSize);
  const remaining = applyTransactionsCursor(rows, readTransactionsCursor(query));
  const page = remaining.slice(0, pageSize);
  const last = page.at(-1);

  return {
    address,
    transactions: page,
    ...(last &&
      remaining.length > page.length && {
        next_cursor: { block_number: last.block_number, transition_id: last.transition_id },
      }),
  };
}
