import { Psbt } from "bitcoinjs-lib";

/**
 * Combine the crafted (unsigned) PSBT with the signed PSBT from the device into a broadcastable raw
 * transaction (hex).
 *
 * The crafted PSBT (`craftedTx`) carries the full per-input data — `witnessUtxo` / `nonWitnessUtxo`
 * and scripts — that finalization needs; the device returns a PSBT holding the partial signatures in
 * `signatures[0]` (base64). We merge the signatures **into** the crafted PSBT (`Psbt.combine`),
 * finalize every input and extract the raw transaction. Starting from the crafted PSBT (rather than
 * finalizing the returned one directly) means a minimal signed PSBT — signatures only, no input
 * metadata — still finalizes.
 */
export function combine(craftedTx: string, signatures: string[]): string {
  const signedPsbtBase64 = signatures[0];
  if (!signedPsbtBase64) {
    throw new Error("combine: expected a signed PSBT in signatures[0]");
  }

  const psbt = Psbt.fromBase64(craftedTx);
  psbt.combine(Psbt.fromBase64(signedPsbtBase64));
  psbt.finalizeAllInputs();
  return psbt.extractTransaction().toHex();
}
