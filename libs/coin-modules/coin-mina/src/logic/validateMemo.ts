// Mina memos hold at most 32 UTF-8 bytes, and a multi-byte character uses more than one
export const MINA_MEMO_MAX_SIZE = 32;

export function validateMemo(memo?: string): boolean {
  return !memo || Buffer.byteLength(memo, "utf8") <= MINA_MEMO_MAX_SIZE;
}
