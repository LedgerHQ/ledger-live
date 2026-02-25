export const ALGORAND_MAX_MEMO_SIZE = 32;

export function validateMemo(memo?: string | undefined | null): boolean {
  return !memo || memo.length <= ALGORAND_MAX_MEMO_SIZE;
}
