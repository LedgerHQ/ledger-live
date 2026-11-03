import { useEffect, useState } from "react";
import { getMockServerStatus, type MockServerConfig } from "@features/platform-device-mock-server";
import type { MockServerStatus } from "./types";

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
    const poll = async () => {
      const next = await getMockServerStatus(config);
      if (!isActive) return;
      setStatus(next.status);
      setSessionId(next.sessionId);
    };
    void poll();
    const intervalId = setInterval(poll, STATUS_POLL_INTERVAL_MS);
    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [config]);

  return { status, sessionId };
}
