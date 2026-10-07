import { useCallback, useRef } from "react";
import { copyToClipboard } from "@shared/clipboard";

export function useCopyToClipboard(callback?: (text: string) => void) {
  const textRef = useRef<string>(undefined);

  const copy = useCallback(async () => {
    const text = textRef.current ?? "";
    if (!(await copyToClipboard(text))) return;
    callback?.(text);
  }, [callback]);

  return (text: string) => {
    textRef.current = text;
    copy();
  };
}
