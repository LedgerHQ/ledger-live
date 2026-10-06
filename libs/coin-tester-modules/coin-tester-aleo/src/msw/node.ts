import type {
  AleoLatestBlockResponse,
  AleoPublicTransactionDetailsResponse,
  AleoTransition,
} from "@ledgerhq/coin-aleo/types";
import { PROGRAM_ID } from "@ledgerhq/coin-aleo/constants";
import type { DevnodeBlock, DevnodeConfirmedTransaction, DevnodeTransition } from "../devnode";
import { getBlock, getBlocksFrom, getLatestHeight, getMapping } from "../devnode";
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

function toApiTransition(transition: DevnodeTransition): AleoTransition {
  return {
    id: transition.id,
    scm: transition.scm,
    tcm: transition.tcm,
    tpk: transition.tpk,
    // Same runtime shape; the API type is a discriminated union the devnode type is not.
    inputs: transition.inputs as unknown as AleoTransition["inputs"],
    outputs: transition.outputs as unknown as AleoTransition["outputs"],
    program: transition.program,
    function: transition.function,
  };
}

type ConfirmedTransactionLookup = { block: DevnodeBlock; confirmed: DevnodeConfirmedTransaction };

async function findConfirmedTransaction(id: string): Promise<ConfirmedTransactionLookup> {
  for (const block of await getBlocksFrom(0)) {
    const confirmed = (block.transactions ?? []).find(candidate => candidate.transaction.id === id);
    if (confirmed) return { block, confirmed };
  }
  throw new Error(`aleo coin-tester: no block carries transaction ${id}`);
}

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
    fee_value: parseFee(confirmed.transaction),
    block_height: block.header.metadata.height,
    block_hash: block.block_hash,
    block_timestamp: String(block.header.metadata.timestamp),
    status: "Accepted",
  };
}
