import type { AleoPrivateRecord } from "@ledgerhq/coin-aleo/types";
import { PROGRAM_ID } from "@ledgerhq/coin-aleo/constants";
import type { DevnodeConfirmedTransaction, DevnodeTransition } from "../devnode";
import { getBlock, getLatestHeight, parseFutureSender } from "../devnode";
import { loadAleoWasm } from "../wasm";

/** credits.aleo declares exactly one record type, under this name. */
const CREDITS_RECORD_NAME = "credits";

/** Every transition in a confirmed transaction, execution phase then fee phase. */
function collectTransitions(confirmed: DevnodeConfirmedTransaction): DevnodeTransition[] {
  const fee = confirmed.transaction.fee?.transition;
  return [...(confirmed.transaction.execution?.transitions ?? []), ...(fee ? [fee] : [])];
}

export type RecordStore = {
  /** Scans every block above the watermark and folds it into the store. */
  refresh: () => Promise<void>;
  list: (filter?: { unspent?: boolean }) => AleoPrivateRecord[];
  plaintextByCommitment: (commitment: string) => string | undefined;
  /** Height of the last block folded in; exposed so callers can confirm a refresh() was incremental. */
  readonly watermark: number;
  /**
   * Count of `getBlock` calls made across every `refresh()` so far. Exposed so
   * a caller can prove `refresh()` only fetches blocks above the previous
   * watermark, rather than rescanning the whole chain each time.
   */
  readonly blocksFetched: number;
};

/**
 * A view-key-only credits.aleo record scanner, incremental across calls.
 *
 * Mirrors what a production record scanner exposes: it never touches a private
 * key or computes a serial number, and it never drops a plaintext once spent —
 * only `spent` flips, so a caller building transaction history still has the
 * record to show.
 */
export function createRecordStore({
  viewKey,
  address,
}: {
  viewKey: string;
  address: string;
}): RecordStore {
  let watermark = -1;
  let blocksFetched = 0;
  const recordsByCommitment = new Map<string, AleoPrivateRecord>();
  const plaintexts = new Map<string, string>();
  // Grows with the watermark: every input.tag seen on a record-typed input,
  // across execution and fee transitions alike.
  const spentTags = new Set<string>();
  // Tags of every record this view key has ever decrypted, i.e. every record
  // `address` has owned. Lets `determineSender` recognize a self-spend on a
  // transition that carries no future.
  const ownedTags = new Set<string>();

  /**
   * Called once this view key has decrypted one of the transition's outputs
   * as its own. A public-touching transition carries a future whose first
   * argument is the sender, read directly. A purely private one carries no
   * future, so the only sender this view key can ever prove is itself, via a
   * self-spend (an input tag already recognized as owned) — otherwise the
   * sender is unattributable, which is Aleo's privacy model working as
   * intended, not a scanner gap. `""` signals "unknown", matching
   * network/utils.ts's `sender_address === ""` check.
   */
  function determineSender(transition: DevnodeTransition): string {
    const hasFuture = transition.outputs.some(output => output.type === "future");
    if (hasFuture) return parseFutureSender(transition);

    const isSelfSpend = transition.inputs.some(
      input => input.type === "record" && input.tag && ownedTags.has(input.tag),
    );
    return isSelfSpend ? address : "";
  }

  async function refresh(): Promise<void> {
    const wasm = await loadAleoWasm();
    const latest = await getLatestHeight();

    for (let height = watermark + 1; height <= latest; height++) {
      const block = await getBlock(height);
      blocksFetched++;

      block.transactions.forEach((confirmed, transactionIndex) => {
        collectTransitions(confirmed).forEach((transition, transitionIndex) => {
          for (const input of transition.inputs) {
            if (input.type === "record" && input.tag) spentTags.add(input.tag);
          }

          if (transition.program !== PROGRAM_ID.CREDITS) return;

          transition.outputs.forEach((output, outputIndex) => {
            if (output.type !== "record" || !output.value) return;

            // Ground truth per the wasm's record-commitment defect (see
            // docs/wasm-record-commitment.md): read the chain's own id, never
            // re-derive it from the decrypted plaintext.
            const commitment = output.id;

            const ciphertext = wasm.RecordCiphertext.fromString(output.value);
            const recordViewKey = ciphertext.recordViewKey(wasm.ViewKey.from_string(viewKey));

            let plaintext;
            try {
              plaintext = ciphertext.decryptWithRecordViewKey(recordViewKey);
            } catch {
              return; // Not owned by this view key.
            }
            // Cross-checks that viewKey was truly paired with address.
            if (plaintext.owner().toString() !== address) return;

            const tag = wasm.RecordCiphertext.tag(
              wasm.GraphKey.from_view_key(wasm.ViewKey.from_string(viewKey)),
              wasm.Field.fromString(commitment),
            ).toString();

            ownedTags.add(tag);
            plaintexts.set(commitment, plaintext.toString());
            recordsByCommitment.set(commitment, {
              block_height: block.header.metadata.height,
              block_timestamp: block.header.metadata.timestamp,
              commitment,
              function_name: transition.function,
              output_index: outputIndex,
              owner: plaintext.owner().toString(),
              program_name: transition.program,
              record_ciphertext: output.value,
              record_name: CREDITS_RECORD_NAME,
              sender: determineSender(transition),
              spent: false, // Recomputed below once this pass's tags are all in.
              tag,
              transaction_id: confirmed.transaction.id,
              transition_id: transition.id,
              transaction_index: transactionIndex,
              transition_index: transitionIndex,
            });
          });
        });
      });

      watermark = height;
    }

    for (const record of recordsByCommitment.values()) {
      record.spent = spentTags.has(record.tag);
    }
  }

  function list({ unspent }: { unspent?: boolean } = {}): AleoPrivateRecord[] {
    const all = [...recordsByCommitment.values()];
    return unspent ? all.filter(record => !record.spent) : all;
  }

  function plaintextByCommitment(commitment: string): string | undefined {
    return plaintexts.get(commitment);
  }

  return {
    refresh,
    list,
    plaintextByCommitment,
    get watermark() {
      return watermark;
    },
    get blocksFetched() {
      return blocksFetched;
    },
  };
}
