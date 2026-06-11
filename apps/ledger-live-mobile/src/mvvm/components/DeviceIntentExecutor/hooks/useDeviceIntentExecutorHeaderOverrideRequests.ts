import { useCallback, useMemo, useRef, useState } from "react";
import type { DeviceIntentExecutorHeaderContextValue } from "../utils/DeviceIntentExecutorHeaderContext";

type UseDeviceIntentExecutorHeaderOverrideRequestsReturn = Readonly<{
  hasHeaderOverride: boolean;
  headerContextValue: DeviceIntentExecutorHeaderContextValue;
}>;

export function useDeviceIntentExecutorHeaderOverrideRequests(): UseDeviceIntentExecutorHeaderOverrideRequestsReturn {
  const [hasHeaderOverride, setHasHeaderOverride] = useState(false);
  const requestsRef = useRef(new Set<number>());
  const nextRequestIdRef = useRef(0);

  const requestHeaderOverride = useCallback<
    DeviceIntentExecutorHeaderContextValue["requestHeaderOverride"]
  >(() => {
    const requestId = nextRequestIdRef.current;
    nextRequestIdRef.current += 1;
    requestsRef.current.add(requestId);
    setHasHeaderOverride(true);

    return () => {
      requestsRef.current.delete(requestId);
      setHasHeaderOverride(requestsRef.current.size > 0);
    };
  }, []);

  const headerContextValue = useMemo<DeviceIntentExecutorHeaderContextValue>(
    () => ({ requestHeaderOverride }),
    [requestHeaderOverride],
  );

  return {
    hasHeaderOverride,
    headerContextValue,
  };
}
