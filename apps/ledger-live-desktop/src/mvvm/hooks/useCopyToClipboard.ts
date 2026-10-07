import { useCallback, useRef } from "react";
import { copyToClipboard } from "@shared/clipboard";

export function useCopyToClipboard(callback?: (text: string) => void) {
  const textRef = useRef<string>(undefined);

  const copy = useCallback(async () => {
    const text = textRef.current ?? "";
    if (!(await copyToClipboard(text))) return false;
    callback?.(text);
    return true;
  }, [callback]);

  return (text: string) => {
    textRef.current = text;
    return copy();
  };
}
