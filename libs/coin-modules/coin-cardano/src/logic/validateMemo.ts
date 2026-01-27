// From the Cardano metadata documentation:
// > Strings must be at most 64 bytes when UTF-8 encoded.
// https://developers.cardano.org/docs/get-started/cardano-serialization-lib/transaction-metadata/#metadata-limitations
export const CARDANO_MAX_MEMO_TAG_SIZE = 64;

export function validateMemo(memo?: string): boolean {
  return !memo || Buffer.from(memo).byteLength <= CARDANO_MAX_MEMO_TAG_SIZE;
}
