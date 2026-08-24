import {
  KaspaHwTransaction,
  KaspaHwTransactionInput,
  KaspaHwTransactionOutput,
} from "../../types/kaspaHwTransaction";
import type { UnsignedKaspaTransaction } from "./craftTransaction";

/**
 * Attach per-input device signatures to an unsigned Kaspa transaction (as produced by
 * `craftTransaction`) and return the signed transaction JSON ready for `broadcast`.
 *
 * Follows the generic-adapter contract: `signatures` is always a 1-element array containing
 * a JSON-encoded string array of per-input hex signatures (one per UTXO input). Each input
 * carries a different sighash, so N signatures are required — packed into one string by the
 * signer so the chain-agnostic framework's single-return-value contract is satisfied.
 */
export function combine(tx: string, signatures: string[]): string {
  const unsigned: UnsignedKaspaTransaction = JSON.parse(tx);

  if (signatures.length !== 1) {
    throw new Error(
      `kaspa: combine expects exactly 1 packed signature string, got ${signatures.length}`,
    );
  }

  let sigs: string[];
  try {
    const parsed: unknown = JSON.parse(signatures[0]);
    if (!Array.isArray(parsed) || !parsed.every(s => typeof s === "string")) {
      throw new Error("not a string array");
    }
    sigs = parsed;
  } catch {
    throw new Error("kaspa: combine signature must be a JSON-encoded string array");
  }

  if (sigs.length !== unsigned.inputs.length) {
    throw new Error(
      `kaspa: combine expected ${unsigned.inputs.length} per-input signature(s), got ${sigs.length}`,
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
    hwInput.setSignature(sigs[index]);
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
