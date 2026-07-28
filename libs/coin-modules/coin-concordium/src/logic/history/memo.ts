import { decodeMemoFromCbor } from "@ledgerhq/concordium-core";
import { log } from "@ledgerhq/logs";

/**
 * Decodes a hex-encoded CBOR memo. Returns undefined (and logs) when decoding fails.
 */
export function decodeMemo(hex: string, txHash: string): string | undefined {
  try {
    return decodeMemoFromCbor(Buffer.from(hex, "hex"));
  } catch {
    log("concordium", `Failed to decode memo for tx ${txHash}`);
    return undefined;
  }
}
