type MemoApplicationFn = (
  memoValue: string | number | undefined,
  memoType: string | undefined,
  currentTransaction: Record<string, unknown>,
) => Record<string, unknown>;

type SendRecipientPatchInput = Readonly<{
  address?: string;
  memo?: Readonly<{ value: string; type?: string }>;
  destinationTag?: string;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const memoApplicationRegistry: Record<string, MemoApplicationFn> = {
  solana: (memo, _type, transaction) => {
    const currentModel = isRecord(transaction.model) ? transaction.model : {};
    const currentUiState = isRecord(currentModel.uiState) ? currentModel.uiState : {};
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
    const currentComment = isRecord(transaction.comment) ? transaction.comment : {};
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

export function buildRecipientTransactionPatch(
  transaction: Record<string, unknown> & { family: string },
  recipient: SendRecipientPatchInput,
): Record<string, unknown> {
  const patch: Record<string, unknown> = { recipient: recipient.address };

  if (recipient.memo !== undefined) {
    Object.assign(
      patch,
      applyMemoToTransaction(
        transaction.family,
        recipient.memo.value,
        recipient.memo.type,
        transaction,
      ),
    );
  }

  if (recipient.destinationTag !== undefined) {
    const trimmedDestinationTag = recipient.destinationTag.trim();
    if (trimmedDestinationTag === "") {
      Object.assign(patch, applyMemoToTransaction(transaction.family, undefined, transaction));
    } else {
      const parsedTag = Number(trimmedDestinationTag);
      if (Number.isFinite(parsedTag)) {
        Object.assign(patch, applyMemoToTransaction(transaction.family, parsedTag, transaction));
      }
    }
  }

  return patch;
}
