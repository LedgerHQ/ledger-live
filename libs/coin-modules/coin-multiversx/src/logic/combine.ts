/**
 * Combine unsigned transaction with signature.
 * Pure transformation function for transaction signing (Story 4.5).
 */
import type { MultiversXProtocolTransaction } from "../types";

/**
 * Combines an unsigned transaction with a signature to produce a signed transaction.
 *
 * @param unsignedTx - JSON string from craftTransaction containing unsigned transaction
 * @param signature - Hex-encoded signature from hardware wallet
 * @param _pubkey - Optional public key (not used for MultiversX, kept for interface compliance)
 * @returns JSON string containing signed transaction ready for broadcast
 * @throws Error if unsignedTx is malformed JSON or missing required fields
 * @example
 * ```typescript
 * const unsignedTx = await api.craftTransaction(intent);
 * const signedTx = combine(unsignedTx.transaction, signature);
 * const hash = await api.broadcast(signedTx);
 * ```
 */
export function combine(unsignedTx: string, signature: string, _pubkey?: string): string {
  // Parse the unsigned transaction
  let tx: unknown;
  try {
    tx = JSON.parse(unsignedTx);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "unknown error";
    throw new Error(`Invalid unsigned transaction: malformed JSON - ${errorMessage}`);
  }

  // Validate transaction structure matches MultiversXProtocolTransaction
  if (typeof tx !== "object" || tx === null) {
    throw new Error("Invalid unsigned transaction: must be an object");
  }

  const txObj = tx as Record<string, unknown>;

  // Validate required fields (consistent with broadcast() validation)
  if (
    typeof txObj.nonce !== "number" ||
    typeof txObj.sender !== "string" ||
    typeof txObj.receiver !== "string" ||
    typeof txObj.value !== "string" ||
    typeof txObj.gasPrice !== "number" ||
    typeof txObj.gasLimit !== "number" ||
    typeof txObj.chainID !== "string" ||
    typeof txObj.version !== "number" ||
    typeof txObj.options !== "number"
  ) {
    throw new Error("Invalid unsigned transaction: missing or invalid required fields");
  }

  // Ensure signature field is not already present (edge case: overwrite if exists)
  const { signature: existingSignature, ...txWithoutSignature } = txObj;

  // Add signature to transaction
  const signedTx: MultiversXProtocolTransaction = {
    ...txWithoutSignature,
    nonce: txObj.nonce as number,
    value: txObj.value as string,
    receiver: txObj.receiver as string,
    sender: txObj.sender as string,
    gasPrice: txObj.gasPrice as number,
    gasLimit: txObj.gasLimit as number,
    chainID: txObj.chainID as string,
    version: txObj.version as number,
    options: txObj.options as number,
    signature,
  };

  // Preserve optional data field if present
  if (txObj.data !== undefined && typeof txObj.data === "string") {
    signedTx.data = txObj.data;
  }

  // Return as JSON string
  return JSON.stringify(signedTx);
}
