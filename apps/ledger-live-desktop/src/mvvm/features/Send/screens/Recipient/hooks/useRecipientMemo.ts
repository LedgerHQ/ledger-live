import { useCallback, useMemo, useRef, useState } from "react";
import type { Memo } from "../../../types";

export type SkipMemoState = "propose" | "toConfirm";

type UseRecipientMemoProps = Readonly<{
  hasMemo: boolean;
  memoDefaultOption?: string;
  memoType?: string;
  memoTypeOptions?: readonly string[];
  onMemoChange: (memo: Memo) => void;
  onMemoSkip: () => void;
  resetKey: string;
}>;

type UseRecipientMemoResult = Readonly<{
  memo: Memo;
  hasMemoTypeOptions: boolean;
  showMemoValueInput: boolean;
  showSkipMemo: boolean;
  skipMemoState: SkipMemoState;
  hasFilledMemo: boolean;
  onMemoValueChange: (value: string) => void;
  onMemoTypeChange: (type: string) => void;
  onSkipMemoRequestConfirm: () => void;
  onSkipMemoCancelConfirm: () => void;
  onSkipMemoConfirm: () => void;
}>;

function buildDefaultMemo(memoDefaultOption?: string): Memo {
  return { value: "", type: memoDefaultOption };
}

export function useRecipientMemo({
  hasMemo,
  memoDefaultOption,
  memoType,
  memoTypeOptions,
  onMemoChange,
  onMemoSkip,
  resetKey,
}: UseRecipientMemoProps): UseRecipientMemoResult {
  const [memo, setMemo] = useState<Memo>(() => buildDefaultMemo(memoDefaultOption));
  const [skipMemoState, setSkipMemoState] = useState<SkipMemoState>("propose");

  const lastResetKeyRef = useRef<string>("");
  if (lastResetKeyRef.current !== resetKey) {
    lastResetKeyRef.current = resetKey;
    const nextDefaultMemo = buildDefaultMemo(memoDefaultOption);

    if (memo.value !== nextDefaultMemo.value || memo.type !== nextDefaultMemo.type) {
      setMemo(nextDefaultMemo);
      onMemoChange(nextDefaultMemo);
    }

    if (skipMemoState !== "propose") {
      setSkipMemoState("propose");
    }
  }

  const hasMemoTypeOptions = Boolean(memoType === "typed" && memoTypeOptions?.length);

  const showMemoValueInput = memo.type !== "NO_MEMO";

  const showSkipMemo = useMemo((): boolean => {
    if (!hasMemo) return false;
    const noMemoWithoutType = !memo.type && memo.value.length === 0;
    const noMemoWithType = Boolean(memo.type && memo.type !== "NO_MEMO" && memo.value.length === 0);
    return Boolean(noMemoWithoutType || noMemoWithType);
  }, [hasMemo, memo.type, memo.value.length]);

  const hasFilledMemo = useMemo(() => {
    if (!hasMemo) return true;
    return memo.value.length > 0 || memo.type === "NO_MEMO";
  }, [hasMemo, memo.type, memo.value.length]);

  const onMemoValueChange = useCallback(
    (value: string) => {
      setMemo(prev => {
        const next = { ...prev, value };
        onMemoChange(next);
        return next;
      });
    },
    [onMemoChange],
  );

  const onMemoTypeChange = useCallback(
    (type: string) => {
      const next: Memo = { value: "", type };
      setMemo(next);
      onMemoChange(next);
    },
    [onMemoChange],
  );

  const onSkipMemoRequestConfirm = useCallback(() => {
    setSkipMemoState("toConfirm");
  }, []);

  const onSkipMemoCancelConfirm = useCallback(() => {
    setSkipMemoState("propose");
  }, []);

  const onSkipMemoConfirm = useCallback(() => {
    const next: Memo = { value: "", type: "NO_MEMO" };
    setMemo(next);
    onMemoChange(next);
    onMemoSkip();
  }, [onMemoChange, onMemoSkip]);

  return {
    memo,
    hasMemoTypeOptions,
    showMemoValueInput,
    showSkipMemo,
    skipMemoState,
    hasFilledMemo,
    onMemoValueChange,
    onMemoTypeChange,
    onSkipMemoRequestConfirm,
    onSkipMemoCancelConfirm,
    onSkipMemoConfirm,
  };
}
