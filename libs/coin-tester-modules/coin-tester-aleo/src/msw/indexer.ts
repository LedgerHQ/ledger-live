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

function parseU64(literal: string, field: string): number {
  const match = /^(\d+)u64$/.exec(literal.trim());
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
  return parseU64(base.value, "base fee") + parseU64(priority.value, "priority fee");
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
  if (confirmed.status !== "accepted") {
    throw new Error(
      `aleo coin-tester: cannot index ${transition.program}/${transition.function} with status '${confirmed.status}'`,
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
    transaction_id: confirmed.transaction.id,
    transition_id: transition.id,
    transaction_status: "Accepted",
    block_number: block.header.metadata.height,
    block_hash: block.block_hash,
    block_timestamp: String(block.header.metadata.timestamp),
    function_id: transition.function,
    amount: parseU64(amount.value, "amount"),
    sender_address: sender,
    recipient_address: recipient.value.trim(),
    program_id: transition.program,
    fee: parseFee(confirmed.transaction),
  };
}

export async function scanIndexedTransfers(): Promise<AleoPublicTransaction[]> {
  const rows: AleoPublicTransaction[] = [];

  for (const block of await getBlocksFrom(0)) {
    for (const confirmed of block.transactions ?? []) {
      // A real fee master leaves no transfer in the user's history.
      if (isSponsorTransaction(confirmed.transaction.id)) continue;
      for (const transition of confirmed.transaction.execution?.transitions ?? []) {
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

/** Sync resumes with a block number alone, which production reads as "after that whole block". */
export function transactionsAfterCursor(
  address: string,
  rows: AleoPublicTransaction[],
  query: URLSearchParams,
): AleoPublicTransactionsResponse {
  const cursor = query.get("cursor_block_number");
  return {
    address,
    transactions: cursor === null ? rows : rows.filter(row => row.block_number > Number(cursor)),
  };
}
