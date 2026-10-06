import type { AleoPrivateRecord } from "@ledgerhq/coin-aleo/types";
import { PROGRAM_ID } from "@ledgerhq/coin-aleo/constants";
import type { DevnodeConfirmedTransaction, DevnodeTransition } from "../devnode";
import { getBlocksFrom, parseFutureSender } from "../devnode";
import type { ResolveRecord } from "../tlv/decodeRequest";
import { loadAleoWasm } from "../wasm";

const CREDITS_RECORD_NAME = "credits";

function collectTransitions(confirmed: DevnodeConfirmedTransaction): DevnodeTransition[] {
  const fee = confirmed.transaction.fee?.transition;
  return [...(confirmed.transaction.execution?.transitions ?? []), ...(fee ? [fee] : [])];
}

export type RecordStore = {
  refresh: () => Promise<void>;
  list: (filter?: { unspent?: boolean }) => AleoPrivateRecord[];
  plaintextByCommitment: (commitment: string) => string | undefined;
  readonly watermark: number;
  readonly blocksScanned: number;
};

/** View-key-only, incremental credits.aleo scanner; spent records stay listed with `spent: true`. */
export function createRecordStore({
  viewKey,
  address,
}: {
  viewKey: string;
  address: string;
}): RecordStore {
  let watermark = -1;
  let blocksScanned = 0;
  const recordsByCommitment = new Map<string, AleoPrivateRecord>();
  const plaintexts = new Map<string, string>();
  const spentTags = new Set<string>();
  const ownedTags = new Set<string>();

  // A purely private transition hides its sender unless it is a self-spend; "" means unknown.
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

    for (const block of await getBlocksFrom(watermark + 1)) {
      blocksScanned++;

      block.transactions.forEach((confirmed, transactionIndex) => {
        collectTransitions(confirmed).forEach((transition, transitionIndex) => {
          for (const input of transition.inputs) {
            if (input.type === "record" && input.tag) spentTags.add(input.tag);
          }

          if (transition.program !== PROGRAM_ID.CREDITS) return;

          transition.outputs.forEach((output, outputIndex) => {
            if (output.type !== "record" || !output.value) return;

            // Never re-derive from the plaintext: see the README's "Known wasm defects".
            const commitment = output.id;

            const ciphertext = wasm.RecordCiphertext.fromString(output.value);
            const recordViewKey = ciphertext.recordViewKey(wasm.ViewKey.from_string(viewKey));

            let plaintext;
            try {
              plaintext = ciphertext.decryptWithRecordViewKey(recordViewKey);
            } catch {
              return;
            }
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
              spent: false,
              tag,
              transaction_id: confirmed.transaction.id,
              transition_id: transition.id,
              transaction_index: transactionIndex,
              transition_index: transitionIndex,
            });
          });
        });
      });

      watermark = block.header.metadata.height;
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
    get blocksScanned() {
      return blocksScanned;
    },
  };
}

/** Works around the wasm printing `_version` one below the chain's value; see the README's "Known wasm defects". */
export function correctRecordVersion(plaintext: string): string {
  const versionMatch = plaintext.match(/_version:\s*(\d+)u8/);
  if (!versionMatch) {
    throw new Error("aleo coin-tester: record plaintext carries no _version field");
  }
  const corrected = Number(versionMatch[1]) + 1;
  return plaintext.replace(/_version:\s*\d+u8/, `_version: ${corrected}u8`);
}

export function makeRecordResolver(store: RecordStore): ResolveRecord {
  return commitment => {
    const plaintext = store.plaintextByCommitment(commitment);
    if (!plaintext) {
      throw new Error(`aleo coin-tester: no record plaintext for commitment ${commitment}`);
    }
    return correctRecordVersion(plaintext);
  };
}
