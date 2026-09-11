import { useCallback, useEffect, useRef, useState } from "react";
import type { RequestReceiveVerifyHint } from "../../types";

const COPY_FEEDBACK_MS = 3000;

type UseRequestReceiveViewParams = Readonly<{
  onCopy: () => void;
  onClose: () => void;
  verifyHint?: RequestReceiveVerifyHint;
}>;

type UseRequestReceiveView = Readonly<{
  hasCopied: boolean;
  hint?: RequestReceiveVerifyHint;
  handleCopy: () => void;
  handleClose: () => void;
}>;

export function useRequestReceiveView({
  onCopy,
  onClose,
  verifyHint,
}: UseRequestReceiveViewParams): UseRequestReceiveView {
  const [hasCopied, setHasCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const handleCopy = useCallback(() => {
    onCopy();
    setHasCopied(true);
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setHasCopied(false), COPY_FEEDBACK_MS);
  }, [onCopy]);

  const handleClose = useCallback(() => {
    if (verifyHint) {
      return;
    }
    onClose();
  }, [onClose, verifyHint]);

  return { hasCopied, hint: verifyHint, handleCopy, handleClose };
}
