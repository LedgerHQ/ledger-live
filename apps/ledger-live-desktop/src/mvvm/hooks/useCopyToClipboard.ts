import { useCallback, useRef } from "react";

export function useCopyToClipboard(callback?: (text: string) => void) {
  const textRef = useRef<string>(undefined);

  const copy = useCallback(() => {
    const text = textRef.current ?? "";
    navigator.clipboard.writeText(text).then(() => {
      if (callback) {
        callback(text);
      }
    });
  }, [callback]);

  return (text: string) => {
    textRef.current = text;
    copy();
  };
}
