import type {
  AleoLatestBlockResponse,
  AleoPublicTransactionDetailsResponse,
  AleoTransition,
} from "@ledgerhq/coin-aleo/types";
import { PROGRAM_ID } from "@ledgerhq/coin-aleo/constants";
import type { DevnodeBlock, DevnodeConfirmedTransaction, DevnodeTransition } from "../devnode";
import { getBlock, getLatestHeight, getMapping } from "../devnode";
import { parseFee } from "./indexer";

export async function fetchLatestBlockV2(): Promise<AleoLatestBlockResponse> {
  const block = await getBlock(await getLatestHeight());
  return {
    block_hash: block.block_hash,
    previous_hash: block.previous_hash,
    header: { metadata: block.header.metadata },
  };
}

export function fetchAccountBalanceV2(address: string): Promise<string | null> {
  return getMapping(PROGRAM_ID.CREDITS, "account", address);
}

/** Public balance of a token program's `balances` mapping for `address`. `parseAmount` on the coin-aleo side matches `/^(\d+)u\d+$/`, so the raw u128 literal needs no reshaping here. */
export function fetchTokenBalanceV2(programId: string, address: string): Promise<string | null> {
  return getMapping(programId, "balances", address);
}

function toApiTransition(transition: DevnodeTransition): AleoTransition {
  return {
    id: transition.id,
    scm: transition.scm,
    tcm: transition.tcm,
    tpk: transition.tpk,
    // The devnode value type has optional `value`/`tag`; the API type is a union
    // discriminated on `type`. The shapes agree at runtime, but not structurally.
    inputs: transition.inputs as unknown as AleoTransition["inputs"],
    outputs: transition.outputs as unknown as AleoTransition["outputs"],
    program: transition.program,
    function: transition.function,
  };
}

type ConfirmedTransactionLookup = { block: DevnodeBlock; confirmed: DevnodeConfirmedTransaction };

// A confirmed transaction never changes once sealed, so every block scanned
// here is scanned at most once for the lifetime of the process: the cache
// carries every transaction id seen so far, and a miss resumes scanning from
// the last height already folded in rather than rescanning from 0.
const confirmedTransactionCache = new Map<string, ConfirmedTransactionLookup>();
let cachedThroughHeight = -1;

/**
 * Ties the cache's lifetime to the chain's rather than the module's. A fresh
 * stack restarts at height 0, and a watermark left over from the previous chain
 * would make every block below it invisible.
 */
export function resetConfirmedTransactionCache(): void {
  confirmedTransactionCache.clear();
  cachedThroughHeight = -1;
}

/**
 * Finds the confirmed transaction carrying `id`, independent of `indexer.ts`'s
 * `INDEXED_FUNCTIONS` allowlist: `getTransactionById` is called for any
 * credits.aleo transition (private transfers included), not only the ones the
 * address-indexed listing understands.
 */
async function findConfirmedTransaction(id: string): Promise<ConfirmedTransactionLookup> {
  const cached = confirmedTransactionCache.get(id);
  if (cached) return cached;

  const height = await getLatestHeight();
  for (let current = cachedThroughHeight + 1; current <= height; current++) {
    const block = await getBlock(current);
    for (const confirmed of block.transactions ?? []) {
      confirmedTransactionCache.set(confirmed.transaction.id, { block, confirmed });
    }
    cachedThroughHeight = current;
  }

  const found = confirmedTransactionCache.get(id);
  if (!found) throw new Error(`aleo coin-tester: no block carries transaction ${id}`);
  return found;
}

/** Devnode's `transaction/{id}` carries no block or fee-total fields, so the block-level ones are read off the confirming block. */
export async function fetchTransactionV2(
  id: string,
): Promise<AleoPublicTransactionDetailsResponse> {
  const { block, confirmed } = await findConfirmedTransaction(id);
  if (confirmed.status !== "accepted") {
    throw new Error(`aleo coin-tester: transaction ${id} has status '${confirmed.status}'`);
  }

  const execution = confirmed.transaction.execution;
  const feeTransition = confirmed.transaction.fee?.transition;
  if (!execution || !feeTransition) {
    throw new Error(`aleo coin-tester: transaction ${id} is not a confirmed execution with a fee`);
  }

  return {
    type: confirmed.transaction.type,
    id,
    execution: { transitions: execution.transitions.map(toApiTransition) },
    global_state_root: execution.global_state_root,
    proof: execution.proof ?? "",
    fee: { transition: toApiTransition(feeTransition) },
    fee_value: parseFee(confirmed),
    block_height: block.header.metadata.height,
    block_hash: block.block_hash,
    block_timestamp: String(block.header.metadata.timestamp),
    status: "Accepted",
  };
}
