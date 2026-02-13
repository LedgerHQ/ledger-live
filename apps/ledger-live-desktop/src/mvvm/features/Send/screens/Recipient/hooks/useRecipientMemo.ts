import { useCallback, useMemo, useRef, useState } from "react";
import type { Memo } from "@ledgerhq/live-common/flows/send/types";
import { useDoNotAskAgainSkipMemo } from "~/renderer/actions/settings";

export type SkipMemoState = "propose" | "toConfirm" | "confirmed";

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
  onSkipMemoConfirm: (doNotAskAgain: boolean) => void;
  resetViewState: () => void;
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
      setMemo((prev: Memo) => {
        if (skipMemoState !== "propose") {
          setSkipMemoState("propose");
        }

        const next = { ...prev, value };
        onMemoChange(next);
        return next;
      });
    },
    [onMemoChange, skipMemoState],
  );

  const onMemoTypeChange = useCallback(
    (type: string) => {
      if (skipMemoState !== "propose") {
        setSkipMemoState("propose");
      }

      const next: Memo = { value: "", type };
      setMemo(next);
      onMemoChange(next);
    },
    [onMemoChange, skipMemoState],
  );

  const [doNotAskAgainSkipMemo, setDoNotAskAgainSkipMemo] = useDoNotAskAgainSkipMemo();

  const onSkipMemoCancelConfirm = useCallback(() => {
    setSkipMemoState("propose");
  }, []);

  const onSkipMemoConfirm = useCallback(
    (doNotAskAgain: boolean) => {
      if (doNotAskAgainSkipMemo !== doNotAskAgain) {
        setDoNotAskAgainSkipMemo(doNotAskAgain);
      }

      setSkipMemoState("confirmed");
      const next: Memo = { value: "", type: "NO_MEMO" };
      setMemo(next);
      onMemoChange(next);
      onMemoSkip();
    },
    [onMemoChange, onMemoSkip, setDoNotAskAgainSkipMemo, doNotAskAgainSkipMemo],
  );

  const onSkipMemoRequestConfirm = useCallback(() => {
    if (doNotAskAgainSkipMemo) {
      onSkipMemoConfirm(doNotAskAgainSkipMemo);
    } else {
      setSkipMemoState("toConfirm");
    }
  }, [doNotAskAgainSkipMemo, onSkipMemoConfirm]);

  const resetViewState = useCallback(() => {
    if (skipMemoState === "confirmed") {
      const defaultMemo = buildDefaultMemo(memoDefaultOption);
      setMemo(defaultMemo);
      onMemoChange(defaultMemo);
      setSkipMemoState("propose");
    }
  }, [memoDefaultOption, onMemoChange, setMemo, skipMemoState, setSkipMemoState]);

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
    resetViewState,
  };
}
