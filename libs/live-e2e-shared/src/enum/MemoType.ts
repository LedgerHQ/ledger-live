export enum StellarMemoType {
  NO_MEMO = "NO_MEMO",
  MEMO_TEXT = "MEMO_TEXT",
  MEMO_ID = "MEMO_ID",
  MEMO_HASH = "MEMO_HASH",
  MEMO_RETURN = "MEMO_RETURN",
}

export const STELLAR_MEMO_TYPE_LABELS: Record<StellarMemoType, string> = {
  [StellarMemoType.NO_MEMO]: "No Memo",
  [StellarMemoType.MEMO_TEXT]: "Memo Text",
  [StellarMemoType.MEMO_ID]: "Memo ID",
  [StellarMemoType.MEMO_HASH]: "Memo Hash",
  [StellarMemoType.MEMO_RETURN]: "Memo Return",
};
