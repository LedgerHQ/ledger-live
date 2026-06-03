import { useCallback, useMemo, useRef, useState } from "react";
import type {
  BottomSheetBackgroundContextValue,
  BottomSheetBackgroundTone,
} from "LLM/contexts/BottomSheetBackgroundContext";

type UseBottomSheetBackgroundToneRequestsReturn = Readonly<{
  backgroundTone: BottomSheetBackgroundTone | undefined;
  backgroundContextValue: BottomSheetBackgroundContextValue;
}>;

export function useBottomSheetBackgroundToneRequests(): UseBottomSheetBackgroundToneRequestsReturn {
  const [backgroundTone, setBackgroundTone] = useState<BottomSheetBackgroundTone>();
  const requestsRef = useRef(new Map<number, BottomSheetBackgroundTone>());
  const nextRequestIdRef = useRef(0);

  const requestBackgroundTone = useCallback<
    BottomSheetBackgroundContextValue["requestBackgroundTone"]
  >(tone => {
    const requestId = nextRequestIdRef.current;
    nextRequestIdRef.current += 1;
    requestsRef.current.set(requestId, tone);
    setBackgroundTone(tone);

    return () => {
      requestsRef.current.delete(requestId);
      const remainingTones = Array.from(requestsRef.current.values());

      setBackgroundTone(remainingTones[remainingTones.length - 1]);
    };
  }, []);

  const backgroundContextValue = useMemo<BottomSheetBackgroundContextValue>(
    () => ({ requestBackgroundTone }),
    [requestBackgroundTone],
  );

  return {
    backgroundTone,
    backgroundContextValue,
  };
}
