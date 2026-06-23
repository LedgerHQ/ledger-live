import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shouldShowCopiedFeedback = Platform.OS !== "android" || Platform.Version < 33;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copyToClipboard = useCallback(
    (text: string) => {
      Clipboard.setString(text);
      if (!shouldShowCopiedFeedback) return;

      setIsCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsCopied(false), 1_000);
    },
    [shouldShowCopiedFeedback],
  );

  const resetCopied = useCallback(() => setIsCopied(false), []);

  return { copyToClipboard, isCopied, resetCopied };
}
