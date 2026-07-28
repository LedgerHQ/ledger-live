// Algorand protocol MaxTxnNoteBytes = 1024
// https://dev.algorand.co/concepts/protocol/protocol-parameters/
export const ALGORAND_MAX_MEMO_SIZE = 1024;

const textEncoder = new TextEncoder();

export function validateMemo(memo?: string | undefined | null): boolean {
  if (!memo) {
    return true;
  }
  // UTF-8 byte length is always >= string.length (UTF-16 code units)
  if (memo.length > ALGORAND_MAX_MEMO_SIZE) {
    return false;
  }
  return textEncoder.encode(memo).length <= ALGORAND_MAX_MEMO_SIZE;
}
