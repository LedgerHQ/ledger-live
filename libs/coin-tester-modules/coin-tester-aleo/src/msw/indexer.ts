import type { AleoPublicTransaction } from "@ledgerhq/coin-aleo/types";
import type { DevnodeBlock, DevnodeConfirmedTransaction, DevnodeTransition } from "../devnode";
import { getBlock, getLatestHeight, parseFutureArguments } from "../devnode";
import { INDEXED_PROGRAMS, SENDER_ABSENT_FROM_FUTURE } from "./programs";

function parseUnsignedLiteral(literal: string, suffix: "u64" | "u128", field: string): number {
  const match = new RegExp(`^(\\d+)${suffix}$`).exec(literal.trim());
  if (!match) {
    throw new Error(`aleo coin-tester: could not read ${field} from '${literal}'`);
  }
  return Number(match[1]);
}

/**
 * The fee lives in its own transition, always billed as fee_public/fee_private
 * on credits.aleo regardless of what program the transfer itself targets.
 * `fee_public`'s inputs are `[baseFee, priorityFee, executionId]`;
 * `fee_private`'s carry a spent record ahead of those same two.
 */
export function parseFee(confirmed: DevnodeConfirmedTransaction): number {
  const feeTransition = confirmed.transaction.fee?.transition;
  if (!feeTransition) {
    throw new Error(`aleo coin-tester: transaction ${confirmed.transaction.id} carries no fee`);
  }
  const offset = feeTransition.function === "fee_private" ? 1 : 0;
  const base = feeTransition.inputs[offset];
  const priority = feeTransition.inputs[offset + 1];
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

/**
 * A rejected execution's transitions, as snarkVM serializes them. The confirmed
 * transaction snarkVM stores for a `RejectedExecute` is a *fee* transaction —
 * `ConfirmedTransaction::rejected_execute` requires `transaction.is_fee()` — so
 * it carries no `execution` field at all. The rejected execution itself moves
 * to a sibling `rejected` field, serialized as
 * `{ "type": "execution", "execution": { "transitions": [...] } }`
 * (`Rejected::Execution`). A rejected *deployment* serializes as
 * `{ "type": "deployment", "program_owner": ..., "deployment": ... }` and
 * carries no transitions.
 */
type DevnodeRejected = {
  type: string;
  execution?: { transitions: DevnodeTransition[] };
};

type DevnodeConfirmedTransactionWithRejection = DevnodeConfirmedTransaction & {
  rejected?: DevnodeRejected;
};

/** snarkVM's confirmed-transaction status, as the Provable API spells it. */
const TRANSACTION_STATUS_BY_DEVNODE_STATUS: Record<string, string> = {
  accepted: "Accepted",
  rejected: "Rejected",
};

/**
 * The transitions to index for one confirmed transaction, whichever side of
 * the accepted/rejected split it fell on. An accepted execution keeps them on
 * `transaction.execution`; a rejected one keeps them on `rejected.execution`.
 * A deployment — accepted or rejected — has none.
 */
function indexableTransitions(
  confirmed: DevnodeConfirmedTransactionWithRejection,
): DevnodeTransition[] {
  const accepted = confirmed.transaction.execution?.transitions;
  if (accepted) return accepted;

  const rejected = confirmed.rejected;
  if (rejected?.type === "execution") return rejected.execution?.transitions ?? [];

  return [];
}

/**
 * The sender a row carries. `SENDER_ABSENT_FROM_FUTURE` yields the empty
 * string, which is what a real indexer publishes for a transition whose future
 * names no caller.
 */
function readSender(
  transition: DevnodeTransition,
  senderArgIndex: number | typeof SENDER_ABSENT_FROM_FUTURE,
): string {
  if (senderArgIndex === SENDER_ABSENT_FROM_FUTURE) return "";

  const sender = parseFutureArguments(transition)[senderArgIndex];
  if (!sender?.startsWith("aleo1")) {
    throw new Error(
      `aleo coin-tester: could not read the sender address from the future of ${transition.id}`,
    );
  }
  return sender;
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

  if (descriptor.senderArgIndex === undefined) {
    throw new Error(
      `aleo coin-tester: ${transition.program}/${transition.function} carries no senderArgIndex — ` +
        "a transition with no future is not an indexable public transfer",
    );
  }
  const sender = readSender(transition, descriptor.senderArgIndex);

  return {
    // For a rejected execution this is the id of the fee transaction snarkVM
    // stored in its place (`Transaction::from_fee`, a fresh fee-tree root), not
    // the id of the execution that was broadcast.
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
    fee: parseFee(confirmed),
  };
}

/** Scans every block from 0 and flattens every transition INDEXED_PROGRAMS knows how to map. */
export async function scanIndexedTransfers(): Promise<AleoPublicTransaction[]> {
  const height = await getLatestHeight();
  const rows: AleoPublicTransaction[] = [];

  for (let current = 0; current <= height; current++) {
    const block = await getBlock(current);
    for (const confirmed of (block.transactions ??
      []) as DevnodeConfirmedTransactionWithRejection[]) {
      for (const transition of indexableTransitions(confirmed)) {
        const descriptor = INDEXED_PROGRAMS[transition.program]?.[transition.function];
        // A transition with no senderArgIndex emits no future — a fully private
        // call chain such as ldg_p_1114.aleo/transfer_private_14 — so it carries
        // no sender to index.
        if (!descriptor || descriptor.senderArgIndex === undefined) continue;
        rows.push(toRow({ block, confirmed, transition }));
      }
    }
  }

  return rows;
}

/** Rows touching `address` on either side, oldest first. */
export async function getAccountTransactionRows(address: string): Promise<AleoPublicTransaction[]> {
  const rows = await scanIndexedTransfers();
  return rows
    .filter(row => row.sender_address === address || row.recipient_address === address)
    .sort((a, b) => a.block_number - b.block_number);
}
