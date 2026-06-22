type MemoApplicationFn = (
  memoValue: string | number | undefined,
  memoType: string | undefined,
  currentTransaction: Record<string, unknown>,
) => Record<string, unknown>;

const memoApplicationRegistry: Record<string, MemoApplicationFn> = {
  solana: (memo, _type, transaction) => {
    const currentModel = (transaction.model as Record<string, unknown> | undefined) || {};
    const currentUiState = (currentModel.uiState as Record<string, unknown> | undefined) || {};
    return {
      model: {
        ...currentModel,
        uiState: {
          ...currentUiState,
          memo,
        },
      },
    };
  },
  casper: memo => ({ transferId: memo }),
  xrp: memo => {
    if (typeof memo === "number") return { tag: memo };
    if (typeof memo === "string") return { tag: Number(memo) };
    return { tag: undefined };
  },
  stellar: (memo, type) => ({ memoValue: memo, memoType: type }),
  ton: (memo, _type, transaction) => {
    const currentComment = (transaction.comment as Record<string, unknown> | undefined) || {};
    return {
      comment: {
        ...currentComment,
        text: memo,
      },
    };
  },
};

export function applyMemoToTransaction(
  family: string,
  memoValue: string | number | undefined,
  memoTypeOrTransaction?: string | Record<string, unknown> | null,
  currentTransaction?: Record<string, unknown>,
): Record<string, unknown> {
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const memoType =
    memoTypeOrTransaction === undefined || typeof memoTypeOrTransaction === "string"
      ? memoTypeOrTransaction
      : undefined;

  const transaction = isRecord(memoTypeOrTransaction)
    ? memoTypeOrTransaction
    : (currentTransaction ?? {});

  const value = memoValue === "" ? undefined : memoValue;

  const applyFn = memoApplicationRegistry[family];
  if (!applyFn) {
    return { memo: value };
  }
  return applyFn(value, memoType, transaction);
}
