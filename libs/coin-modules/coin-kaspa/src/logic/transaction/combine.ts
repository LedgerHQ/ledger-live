import {
  KaspaHwTransaction,
  KaspaHwTransactionInput,
  KaspaHwTransactionOutput,
} from "../../types/kaspaHwTransaction";
import type { UnsignedKaspaTransaction } from "./craftTransaction";

/**
 * Attach per-input device signatures to an unsigned Kaspa transaction (as produced by
 * `craftTransaction`) and return the signed transaction JSON ready for `broadcast`
 * (mirrors `bridge/signOperation.ts`'s `JSON.stringify(tx.toApiJSON())` serialization).
 *
 * Kaspa requires one signature per input (each input can be backed by a different key), so
 * unlike single-witness account chains, `signature` here is a JSON-encoded array of hex
 * signatures, aligned by index with the crafted transaction's `inputs` array.
 */
export function combine(tx: string, signature: string): string {
  const unsigned: UnsignedKaspaTransaction = JSON.parse(tx);
  const signatures: string[] = JSON.parse(signature);

  if (signatures.length !== unsigned.inputs.length) {
    throw new Error(
      `kaspa: combine expected ${unsigned.inputs.length} signature(s), got ${signatures.length}`,
    );
  }

  const inputs = unsigned.inputs.map((input, index) => {
    const hwInput = new KaspaHwTransactionInput({
      value: input.value,
      prevTxId: input.prevTxId,
      outpointIndex: input.outpointIndex,
      addressType: 0,
      addressIndex: 0,
      address: "",
    });
    hwInput.setSignature(signatures[index]);
    return hwInput;
  });

  const outputs = unsigned.outputs.map(
    output =>
      new KaspaHwTransactionOutput({
        value: output.value,
        scriptPublicKey: output.scriptPublicKey,
      }),
  );

  const hwTransaction = new KaspaHwTransaction({
    inputs,
    outputs,
    version: unsigned.version,
  });

  return JSON.stringify(hwTransaction.toApiJSON());
}
