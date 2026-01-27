/**
 * Normalize possible PSBT inputs: base64 (with whitespace/URL-safe), or raw hex.
 *
 * This is a low-level helper; callers that need strict validation and
 * user-facing error messages should use `parsePsbt` instead.
 */
export function normalizeToBuffer(psbtMaybe: string): Buffer | null {
  if (!psbtMaybe) return null;
  const s = psbtMaybe.trim();

  // If hex (even length, only [0-9a-fA-F])  treat as hex
  if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) {
    try {
      return Buffer.from(s, "hex");
    } catch {
      /* ignore and fall through to base64 */
    }
  }

  // Treat as base64: strip whitespace and convert URL-safe to standard
  const b64 = s.replaceAll(/\s+/g, "").replaceAll("-", "+").replaceAll("_", "/");
  // pad base64
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;

  try {
    return Buffer.from(padded, "base64");
  } catch {
    return null;
  }
}

/**
 * Parse a PSBT string into a Buffer, throwing on clearly invalid inputs.
 *
 * This wraps `normalizeToBuffer` but preserves existing error messages used in
 * ledger-live when encountering invalid PSBT payloads.
 */
export function parsePsbt(psbt: string): Buffer {
  const buf = normalizeToBuffer(psbt);

  if (!buf) {
    throw new Error("Invalid PSBT: not valid base64");
  }

  if (!buf.length) {
    throw new Error("Invalid PSBT: empty buffer");
  }

  return buf;
}
