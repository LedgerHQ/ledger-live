import type { MultiversXProtocolTransaction } from "../../types";

/**
 * Attach a hex-encoded signature to a JSON-serialized unsigned MultiversX transaction.
 *
 * The output is a JSON string with the `signature` field added, ready for broadcast.
 */
export function combine(tx: string, signature: string, _pubkey?: string): string {
  let parsed: MultiversXProtocolTransaction;
  try {
    parsed = JSON.parse(tx) as MultiversXProtocolTransaction;
  } catch {
    throw new Error("combine: invalid transaction JSON");
  }

  if (!signature) {
    throw new Error("combine: signature is required");
  }

  const signed: MultiversXProtocolTransaction = {
    ...parsed,
    signature,
  };

  return JSON.stringify(signed);
}
