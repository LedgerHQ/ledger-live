export const STACKS_MAX_MEMO_SIZE = 34;

export function validateMemo(memo: string): boolean {
  return Buffer.from(memo, "utf-8").byteLength <= STACKS_MAX_MEMO_SIZE;
}
