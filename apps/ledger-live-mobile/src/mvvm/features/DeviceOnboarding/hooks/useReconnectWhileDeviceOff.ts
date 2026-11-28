import { useEffect, useRef } from "react";
import { canRetryWithoutUser } from "../utils/deviceOff";

const retryDelayMs = 2_000;

export function useReconnectWhileDeviceOff({
  deviceOff,
  error,
  connect,
}: Readonly<{ deviceOff: boolean; error: string | null; connect: () => void }>) {
  const hasRequestedReconnect = useRef(false);

  useEffect(() => {
    if (!deviceOff) {
      hasRequestedReconnect.current = false;
      return;
    }
    if (!hasRequestedReconnect.current) {
      hasRequestedReconnect.current = true;
      connect();
      return;
    }
    if (error === null || !canRetryWithoutUser(error)) return;
    const timer = setTimeout(connect, retryDelayMs);
    return () => clearTimeout(timer);
  }, [connect, deviceOff, error]);
}
