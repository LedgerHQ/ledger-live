import { useEffect, useRef, useState } from "react";
import type { DelayProps } from "./types";

export const useDisplayWithDelay = ({ isOpen, delay = 0 }: DelayProps): boolean => {
  const [showContent, setShowContent] = useState<boolean>(false);
  const showContentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      showContentTimerRef.current = setTimeout(() => {
        setShowContent(true);
      }, delay);
    }

    return () => {
      if (showContentTimerRef.current) {
        clearTimeout(showContentTimerRef.current);
        showContentTimerRef.current = null;
      }
    };
  }, [isOpen, delay]);

  useEffect(() => {
    if (!isOpen) {
      setShowContent(false);
    }
  }, [isOpen]);

  return isOpen && showContent;
};
