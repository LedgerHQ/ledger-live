// Long enough to cover a 20-byte EVM address (40 hex digits) and every hash or key, short enough
// that ordinary words and error codes survive.
const HEX_RUN = /(?:0x)?[0-9a-f]{32,}/gi;
// Base58 (Solana, Bitcoin), base64 and bech32 (`cosmos1…`, `bc1…`) addresses and payloads. `_` and
// `-` are left out on purpose: error codes such as `ERR_INSUFFICIENT_FUNDS_FOR_GAS` are what a
// dashboard groups on, and none of the encodings above uses them.
const ENCODED_RUN = /[A-Za-z0-9+/=]{32,}/g;

export const MAX_ERROR_MESSAGE_LENGTH = 300;

/**
 * Makes an error message safe to send to a monitoring sink.
 *
 * The text of a broadcast or coin-module error comes from the node, an explorer or the coin module,
 * and can quote the transaction, an address or a key. Those always appear as long encoded runs, so
 * they are replaced, while the human part of the message ("nonce too low", "timeout of 30000ms
 * exceeded") is kept for grouping. The result is also capped, since some nodes echo a whole payload.
 */
export function sanitizeErrorMessage(message: string): string {
  const redacted = message.replace(HEX_RUN, "[hex]").replace(ENCODED_RUN, "[data]");
  return redacted.length > MAX_ERROR_MESSAGE_LENGTH
    ? `${redacted.slice(0, MAX_ERROR_MESSAGE_LENGTH)}…`
    : redacted;
}
