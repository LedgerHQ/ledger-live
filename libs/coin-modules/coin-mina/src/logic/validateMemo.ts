export const MINA_MEMO_MAX_SIZE = 32;

export function validateMemo(memo?: string): boolean {
  return !memo || memo.length <= MINA_MEMO_MAX_SIZE;
}
