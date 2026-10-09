import React, { createContext, useContext, useMemo } from "react";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { speculosDmkTransportFactory } from "../transport/SpeculosDmkTransport";
import { mockserverTransportFactory } from "@ledgerhq/device-transport-kit-mockserver";
import { LedgerLiveLogger } from "@ledgerhq/live-dmk-shared";
import { getEnv } from "@shared/env";
import { LocalTracer } from "@ledgerhq/logs";

const tracer = new LocalTracer("live-dmk-tracer", { function: "useDeviceManagementKit" });

/**
 * Base URL of the device mock server used when the mock server transport is
 * enabled. Defaults to the shared deployment, so the transport works without
 * running a pod locally; point `MOCK_SERVER_TRANSPORT_URL` at a local instance
 * (e.g. http://localhost:9752) to use one.
 *
 * Read through a function rather than captured in a constant because the flag
 * is pushed to all threads at boot, after this module is first imported.
 */
// Scanned rather than matched with /\/+$/, whose backtracking CodeQL flags as
// polynomial on attacker-influenced input.
// See: https://github.com/LedgerHQ/ledger-live/security/code-scanning/358
const stripTrailingSlashes = (value: string): string => {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
};

export const getMockServerTransportUrl = (): string =>
  stripTrailingSlashes(getEnv("MOCK_SERVER_TRANSPORT_URL"));

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
 * Firmware distribution salt of the current user, which selects their progressive OS rollout.
 * The app sets it whenever the user ID is known or changes, via {@link setFirmwareDistributionSalt}.
 */
let firmwareDistributionSalt: string | undefined;

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
  const wsBase = stripTrailingSlashes(mockServerUrl)
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:");
  return `${wsBase}/secure-channel/${sessionToken}`;
};

export const getDeviceManagementKit = (): DeviceManagementKit => {
  if (!instance) {
    const mockServerTransportEnabled = getEnv("MOCK_SERVER_TRANSPORT");
    const mockServerUrl = getMockServerTransportUrl();
    tracer.trace("Initialize DeviceManagementKit", {
      firmwareDistributionSalt,
      mockServerTransportEnabled,
    });

    const builder = new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory)
      .addTransport(speculosDmkTransportFactory)
      .addLogger(new LedgerLiveLogger(LogLevel.Debug))
      .addConfig(firmwareDistributionSalt ? { firmwareDistributionSalt } : {});

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

/** Applies to the DMK built next, and to the current one if it already exists. */
export const setFirmwareDistributionSalt = (salt: string): void => {
  firmwareDistributionSalt = salt;
  instance?.setFirmwareDistributionSalt(salt);
};

export const DeviceManagementKitContext = createContext<DeviceManagementKit | null>(null);

type Props = {
  children: React.ReactNode;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({ children }) => {
  const deviceManagementKit = useMemo(() => getDeviceManagementKit(), []);

  return (
    <DeviceManagementKitContext.Provider value={deviceManagementKit}>
      {children}
    </DeviceManagementKitContext.Provider>
  );
};

export const useDeviceManagementKit = (): DeviceManagementKit => {
  const deviceManagementKit = useContext(DeviceManagementKitContext);
  if (!deviceManagementKit) {
    throw new Error("useDeviceManagementKit must be used within a DeviceManagementKitProvider");
  }
  return deviceManagementKit;
};
