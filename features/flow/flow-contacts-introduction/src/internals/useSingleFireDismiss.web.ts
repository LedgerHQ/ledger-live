import { useCallback, useEffect, useRef } from "react";

export function useSingleFireDismiss(onDismiss: () => void, open: boolean): () => void {
  const hasDismissed = useRef(false);

  useEffect(() => {
    if (open) {
      hasDismissed.current = false;
    }
  }, [open]);

  return useCallback(() => {
    if (hasDismissed.current) {
      return;
    }

    hasDismissed.current = true;
    onDismiss();
  }, [onDismiss]);
}
