import { useEffect, useState } from "react";
import network from "@ledgerhq/live-network";
import { getEnv } from "@shared/env";
import { getMockServerSessionToken, getMockServerTransportUrl } from "@ledgerhq/live-dmk-desktop";

export type MockServerStatus = {
  enabled: boolean;
  connected: boolean;
  sessionToken?: string;
};

const POLL_INTERVAL_MS = 5000;

/**
 * Polls the device mock server `/health` endpoint (at
 * {@link getMockServerTransportUrl}) while the transport is enabled (env
 * `MOCK_SERVER_TRANSPORT`). The session token, seeded at boot and shared with
 * the transport, is re-read on each poll and exposed for the copy-to-clipboard
 * action.
 */
export const useMockServerStatus = (): MockServerStatus => {
  const enabled = getEnv("MOCK_SERVER_TRANSPORT");
  const baseUrl = getMockServerTransportUrl();
  const [connected, setConnected] = useState(false);
  const [sessionToken, setSessionToken] = useState(() => getMockServerSessionToken());

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      // `bootstrapMockServerTransport` can publish the token after the first
      // render, and nothing else re-renders this hook, so it is re-read on
      // every poll rather than at render time.
      if (!cancelled) setSessionToken(getMockServerSessionToken());
      try {
        await network({ method: "GET", url: `${baseUrl}/health`, timeout: 4000 });
        if (!cancelled) setConnected(true);
      } catch {
        if (!cancelled) setConnected(false);
      }
    };

    check();
    const intervalId = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [enabled, baseUrl]);

  return { enabled, connected, sessionToken };
};
