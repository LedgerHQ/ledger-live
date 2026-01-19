/**
 * Hedera maximum size was taken from Ledger Wallet UI
 * It is not related the blockchain specifics
 */
export const HEDERA_MAX_MEMO_SIZE = 100;

export function validateMemo(memo?: string): boolean {
  return !memo || memo.length <= HEDERA_MAX_MEMO_SIZE;
}
