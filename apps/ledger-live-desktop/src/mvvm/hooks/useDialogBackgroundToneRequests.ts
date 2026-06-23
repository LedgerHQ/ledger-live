import { useCallback, useMemo, useRef, useState } from "react";
import type {
  DialogBackgroundContextValue,
  DialogBackgroundTone,
} from "LLD/contexts/DialogBackgroundContext";

type UseDialogBackgroundToneRequestsReturn = Readonly<{
  backgroundTone: DialogBackgroundTone | undefined;
  backgroundContextValue: DialogBackgroundContextValue;
}>;

export function useDialogBackgroundToneRequests(): UseDialogBackgroundToneRequestsReturn {
  const [backgroundTone, setBackgroundTone] = useState<DialogBackgroundTone>();
  const requestsRef = useRef(new Map<number, DialogBackgroundTone>());
  const nextRequestIdRef = useRef(0);

  const requestBackgroundTone = useCallback<DialogBackgroundContextValue["requestBackgroundTone"]>(
    tone => {
      const requestId = nextRequestIdRef.current;
      nextRequestIdRef.current += 1;
      requestsRef.current.set(requestId, tone);
      setBackgroundTone(tone);

      return () => {
        requestsRef.current.delete(requestId);
        const remainingTones = Array.from(requestsRef.current.values());

        setBackgroundTone(remainingTones[remainingTones.length - 1]);
      };
    },
    [],
  );

  const backgroundContextValue = useMemo<DialogBackgroundContextValue>(
    () => ({ requestBackgroundTone }),
    [requestBackgroundTone],
  );

  return {
    backgroundTone,
    backgroundContextValue,
  };
}
