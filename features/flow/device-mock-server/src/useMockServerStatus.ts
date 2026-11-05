import { useEffect, useState } from "react";
import {
  getMockServerStatus,
  type MockServerConfig,
  type MockServerConnectionStatus,
} from "@features/platform-device-mock-server";

export type MockServerStatus = "checking" | MockServerConnectionStatus;

const STATUS_POLL_INTERVAL_MS = 5000;

export function useMockServerStatus(config: MockServerConfig | null): {
  status: MockServerStatus;
  sessionId: string | null;
} {
  const [status, setStatus] = useState<MockServerStatus>("checking");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    // The next check starts once this one ends, so a slow check never overwrites a newer one.
    const poll = async () => {
      const next = await getMockServerStatus(config);
      if (!isActive) return;
      setStatus(next.status);
      setSessionId(next.sessionId);
      timeoutId = setTimeout(poll, STATUS_POLL_INTERVAL_MS);
    };
    void poll();
    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [config]);

  return { status, sessionId };
}
