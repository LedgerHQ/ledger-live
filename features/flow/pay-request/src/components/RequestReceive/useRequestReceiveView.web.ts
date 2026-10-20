import { useCallback, useEffect, useState } from "react";
import type { RequestReceiveVerifyHint } from "../../types";

const COPY_FEEDBACK_MS = 3000;
const HINT_SHOW_DELAY_MS = 500;

type UseRequestReceiveViewParams = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onCopy: () => Promise<boolean>;
  verifyHint?: RequestReceiveVerifyHint;
}>;

type UseRequestReceiveView = Readonly<{
  hasCopied: boolean;
  hint?: RequestReceiveVerifyHint;
  handleOpenChange: (open: boolean) => void;
  handleCopy: () => void;
  handleInteractOutside: (event: CustomEvent) => void;
}>;

export function useRequestReceiveView({
  isOpen,
  onClose,
  onCopy,
  verifyHint,
}: UseRequestReceiveViewParams): UseRequestReceiveView {
  const [hasCopied, setHasCopied] = useState(false);
  const [isHintReady, setIsHintReady] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHasCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !verifyHint?.open) {
      setIsHintReady(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsHintReady(true);
    }, HINT_SHOW_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, verifyHint?.open]);

  useEffect(() => {
    if (!hasCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setHasCopied(false), COPY_FEEDBACK_MS);

    return () => window.clearTimeout(timeoutId);
  }, [hasCopied]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !verifyHint?.open) {
        onClose();
      }
    },
    [onClose, verifyHint?.open],
  );

  const handleCopy = useCallback(async () => {
    if (!(await onCopy())) return;
    setHasCopied(true);
  }, [onCopy]);

  const handleInteractOutside = useCallback(
    (event: CustomEvent) => {
      if (verifyHint?.open) {
        event.preventDefault();
      }
    },
    [verifyHint?.open],
  );

  const hint = verifyHint
    ? {
        ...verifyHint,
        open: verifyHint.open && isHintReady,
      }
    : undefined;

  return {
    hasCopied,
    hint,
    handleOpenChange,
    handleCopy,
    handleInteractOutside,
  };
}
