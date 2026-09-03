import { useCallback, useEffect, useRef, useState } from "react";

const COPY_FEEDBACK_MS = 3000;

type UseRequestReceiveViewParams = Readonly<{
  onCopy: () => void;
}>;

type UseRequestReceiveView = Readonly<{
  hasCopied: boolean;
  handleCopy: () => void;
}>;

export function useRequestReceiveView({
  onCopy,
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

  return { hasCopied, handleCopy };
}
