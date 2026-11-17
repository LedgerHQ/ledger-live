import { useCallback, useEffect, useRef, useState } from "react";

export const reconnectTimeoutMs = 30_000;

export type SessionReconnectState = "reconnecting" | "failed";

export type SessionReconnect = Readonly<{
  state: SessionReconnectState;
  retry: () => void;
}>;

// The scan waits forever for a single known device, so the wait has its own limit.
export function useSessionReconnect({
  dropped,
  error,
  connect,
}: Readonly<{
  dropped: boolean;
  error: string | null;
  connect: () => void;
}>): SessionReconnect | null {
  const [attempt, setAttempt] = useState(0);
  const [timedOutAttempt, setTimedOutAttempt] = useState<number | null>(null);
  const reconnectRequested = useRef(false);

  if (!dropped && timedOutAttempt !== null) setTimedOutAttempt(null);

  useEffect(() => {
    if (!dropped) {
      reconnectRequested.current = false;
      return;
    }
    if (reconnectRequested.current) return;
    reconnectRequested.current = true;
    connect();
  }, [connect, dropped]);

  useEffect(() => {
    if (!dropped) return;
    const timer = setTimeout(() => setTimedOutAttempt(attempt), reconnectTimeoutMs);
    return () => clearTimeout(timer);
  }, [attempt, dropped]);

  const retry = useCallback(() => {
    setAttempt(previous => previous + 1);
    connect();
  }, [connect]);

  if (!dropped) return null;
  const timedOut = timedOutAttempt === attempt;
  return { state: error !== null || timedOut ? "failed" : "reconnecting", retry };
}
