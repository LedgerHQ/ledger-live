import { useCallback, useEffect, useState } from "react";

const COPY_FEEDBACK_MS = 3000;

type UseRequestReceiveViewParams = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onCopy: () => void;
}>;

type UseRequestReceiveView = Readonly<{
  hasCopied: boolean;
  handleOpenChange: (open: boolean) => void;
  handleCopy: () => void;
}>;

export function useRequestReceiveView({
  isOpen,
  onClose,
  onCopy,
}: UseRequestReceiveViewParams): UseRequestReceiveView {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHasCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!hasCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setHasCopied(false), COPY_FEEDBACK_MS);

    return () => window.clearTimeout(timeoutId);
  }, [hasCopied]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  const handleCopy = useCallback(() => {
    onCopy();
    setHasCopied(true);
  }, [onCopy]);

  return { hasCopied, handleOpenChange, handleCopy };
}
