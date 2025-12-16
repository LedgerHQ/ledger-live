export const MAX_MEMO_LENGTH = 500;

export function validateMemo(memo: string): boolean {
  return Buffer.from(memo, "utf-8").byteLength <= MAX_MEMO_LENGTH;
}
