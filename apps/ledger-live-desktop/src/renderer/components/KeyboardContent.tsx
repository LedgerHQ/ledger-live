import React, { useState, useRef, useEffect, useCallback } from "react";

type Props = {
  children: React.ReactNode;
  sequence: string;
};

/**
 * render {children} when the sequence is typed
 */
const KeyboardContent = ({ children, sequence }: Props) => {
  const [enabled, setEnabled] = useState(false);
  const sequenceIndex = useRef(-1);
  const onKeyPress = useCallback(
    (e: KeyboardEvent) => {
      const next = sequence[sequenceIndex.current + 1];
      if (next && next === e.key) {
        sequenceIndex.current++;
      } else {
        sequenceIndex.current = -1;
      }
      if (sequenceIndex.current === sequence.length - 1) {
        sequenceIndex.current = -1;
        setEnabled(prevEnable => !prevEnable);
      }
    },
    [sequence, setEnabled],
  );
  useEffect(() => {
    window.addEventListener("keypress", onKeyPress);
    return () => window.removeEventListener("keypress", onKeyPress);
  }, [onKeyPress]);
  return <>{enabled ? children : null}</>;
};

export default KeyboardContent;
