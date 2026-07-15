import React, { createContext, useContext, useMemo } from "react";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { mockserverTransportFactory } from "@ledgerhq/device-transport-kit-mockserver";
import { LedgerLiveLogger, UserHashService } from "@ledgerhq/live-dmk-shared";
import { getEnv } from "@shared/env";
import { LocalTracer } from "@ledgerhq/logs";

const tracer = new LocalTracer("live-dmk-tracer", { function: "useDeviceManagementKit" });

/**
 * Fixed URL of the local device mock server used when the mock server transport
 * is enabled. Previously configurable via the `MOCK_SERVER_TRANSPORT_URL` env;
 * now a constant since the mock server always runs on this port locally.
 */
export const MOCK_SERVER_TRANSPORT_URL = "http://localhost:9752";

let instance: DeviceManagementKit | null = null;

/**
 * Mock server session token shared with the transport. Set at boot (after a
 * device is seeded) via {@link setMockServerSessionToken}, before the DMK is
 * built. Kept as a module variable (not a live-env var) so it works without
 * rebuilding @ledgerhq/live-env.
 */
let mockServerSessionToken: string | undefined;
export const setMockServerSessionToken = (token: string): void => {
  mockServerSessionToken = token;
};
export const getMockServerSessionToken = (): string | undefined => mockServerSessionToken;

/**
 * Compute the mock server's secure-channel (ScriptRunner) WebSocket base URL.
 * The session token is carried in the path because the secure-channel WebSocket
 * has no bearer header. Shared by the DMK secure-channel config and the legacy
 * `createDeviceSocket` flows (via a `BASE_SOCKET_URL` override at boot), so both
 * hit the same mock endpoint. Returns `undefined` when no token is available.
 */
export const getMockScriptRunnerBaseUrl = (
  mockServerUrl: string,
  sessionToken?: string,
): string | undefined => {
  if (!sessionToken) return undefined;
  const wsBase = mockServerUrl
    .replace(/\/+$/, "")
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:");
  return `${wsBase}/secure-channel/${sessionToken}`;
};

export const getDeviceManagementKit = (): DeviceManagementKit => {
  if (!instance) {
    const userId = getEnv("USER_ID");
    const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;
    const mockServerTransportEnabled = getEnv("MOCK_SERVER_TRANSPORT");
    const mockServerUrl = MOCK_SERVER_TRANSPORT_URL;
    tracer.trace("Initialize DeviceManagementKit", {
      firmwareDistributionSalt,
      mockServerTransportEnabled,
    });

    const builder = new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory)
      .addLogger(new LedgerLiveLogger(LogLevel.Debug))
      .addConfig({ firmwareDistributionSalt });

    if (mockServerTransportEnabled) {
      // Point the secure channel (genuine check, listApps, install…) at the mock
      // server's ScriptRunner WebSocket. The session token is in the path because
      // the secure-channel WebSocket carries no bearer header. Without this the
      // secure-channel APDUs go unanswered (6d00) and the connect flow stalls.
      const webSocketUrl = getMockScriptRunnerBaseUrl(mockServerUrl, mockServerSessionToken);
      builder
        .addTransport(mockserverTransportFactory(mockServerUrl, mockServerSessionToken))
        .addConfig({ mockUrl: mockServerUrl, ...(webSocketUrl ? { webSocketUrl } : {}) });
    }

    instance = builder.build();
  }

  return instance;
};

export const DeviceManagementKitContext = createContext<DeviceManagementKit | null>(null);

type Props = {
  children: React.ReactNode;
  /** Whether the `ldmkTransport` feature flag is enabled, supplied by the consuming app. */
  ldmkTransportEnabled: boolean;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({
  children,
  ldmkTransportEnabled,
}) => {
  const ldmkTransportFlag = ldmkTransportEnabled;

  const deviceManagementKit = useMemo(() => {
    if (!ldmkTransportFlag) return null;
    return getDeviceManagementKit();
  }, [ldmkTransportFlag]);

  if (!ldmkTransportFlag || deviceManagementKit === null) {
    return <>{children}</>;
  }

  return (
    <DeviceManagementKitContext.Provider value={deviceManagementKit}>
      {children}
    </DeviceManagementKitContext.Provider>
  );
};

export const useDeviceManagementKit = (): DeviceManagementKit | null =>
  useContext(DeviceManagementKitContext);
