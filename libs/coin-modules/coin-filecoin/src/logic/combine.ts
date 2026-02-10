/**
 * Combines an unsigned transaction with a signature.
 *
 * Note: The pubkey parameter from the Api interface is not used for Filecoin.
 * The Api interface includes pubkey as an optional parameter to support
 * blockchains that require it (e.g., for multi-sig), but Filecoin's
 * signature format doesn't need the public key to be included separately.
 *
 * @param unsignedTx - JSON string from craftTransaction containing txPayload and message details
 * @param signature - The hex-encoded signature from the device
 * @param _pubkey - Unused for Filecoin
 * @returns JSON string containing signed transaction for broadcast
 * @throws Error if unsignedTx is malformed or missing required fields
 */
export function combine(unsignedTx: string, signature: string, _pubkey?: string): string {
  // Parse the craftTransaction output to get message details
  let craftedTx: { details: Record<string, unknown> };
  try {
    craftedTx = JSON.parse(unsignedTx);
  } catch {
    throw new Error("Invalid unsigned transaction: malformed JSON");
  }

  // Validate required fields
  if (!craftedTx.details) {
    throw new Error("Invalid unsigned transaction: missing details");
  }
  const { method, nonce, sender, recipient, params, value, gasFeeCap, gasPremium, gasLimit } =
    craftedTx.details as Record<string, unknown>;
  if (sender === undefined || recipient === undefined || nonce === undefined) {
    throw new Error(
      "Invalid unsigned transaction: missing required fields (sender, recipient, nonce)",
    );
  }

  // Convert hex signature to base64 (matching signOperation.ts format)
  const signatureBase64 = Buffer.from(signature, "hex").toString("base64");

  // Return signed transaction as JSON string
  // Format matches what broadcast() expects
  const signedTx = JSON.stringify({
    message: {
      version: 0,
      method: method ?? 0,
      nonce,
      params: (params as string) ?? "",
      to: recipient,
      from: sender,
      gaslimit: Number(gasLimit ?? 0),
      gaspremium: (gasPremium as string) ?? "0",
      gasfeecap: (gasFeeCap as string) ?? "0",
      value: (value as string) ?? "0",
    },
    signature: {
      type: 1, // secp256k1
      data: signatureBase64,
    },
  });

  return signedTx;
}
