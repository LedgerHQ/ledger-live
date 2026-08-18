import type { MultiversXProtocolTransaction } from "../../types";

/**
 * Attach a hex-encoded signature to a JSON-serialized unsigned MultiversX transaction.
 *
 * The output is a JSON string with the `signature` field added, ready for broadcast.
 */
export function combine(tx: string, signature: string[], _pubkey?: string): string {
  if (signature.length !== 1) {
    throw new Error(`MultiversX combine expects exactly one signature, got ${signature.length}`);
  }

  let parsed: MultiversXProtocolTransaction;
  try {
    parsed = JSON.parse(tx) as MultiversXProtocolTransaction;
  } catch {
    throw new Error("combine: invalid transaction JSON");
  }

  if (!signature[0]) {
    throw new Error("combine: signature is required");
  }

  const signed: MultiversXProtocolTransaction = {
    ...parsed,
    signature: signature[0],
  };

  return JSON.stringify(signed);
}
