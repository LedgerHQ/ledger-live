import { useEffect, useState } from "react";
import network from "@ledgerhq/live-network";
import { getEnv } from "@shared/env";
import { getMockServerSessionToken, MOCK_SERVER_TRANSPORT_URL } from "@ledgerhq/live-dmk-desktop";

export type MockServerStatus = {
  enabled: boolean;
  connected: boolean;
  sessionToken?: string;
};

const POLL_INTERVAL_MS = 5000;

/**
 * Polls the device mock server `/health` endpoint (fixed URL
 * {@link MOCK_SERVER_TRANSPORT_URL}) while the transport is enabled (env
 * `MOCK_SERVER_TRANSPORT`). The session token, seeded at boot and shared with
 * the transport, is exposed for the copy-to-clipboard action.
 */
export const useMockServerStatus = (): MockServerStatus => {
  const enabled = getEnv("MOCK_SERVER_TRANSPORT");
  const baseUrl = MOCK_SERVER_TRANSPORT_URL;
  const sessionToken = getMockServerSessionToken();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
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
