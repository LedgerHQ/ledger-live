import React, { createContext, useContext, useMemo } from "react";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { mockserverTransportFactory } from "@ledgerhq/device-transport-kit-mockserver";
import { RNBleTransportFactory } from "@ledgerhq/device-transport-kit-react-native-ble";
import { LedgerLiveLogger, UserHashService } from "@ledgerhq/live-dmk-shared";
import { RNHidTransportFactory } from "@ledgerhq/device-transport-kit-react-native-hid";
import { getEnv } from "@shared/env";
import { LocalTracer } from "@ledgerhq/logs";
import { httpProxyTransportFactory, httpProxyUrlSubject } from "../transport/HttpProxyDmkTransport";
import {
  speculosDmkTransportFactory,
  speculosTargetSubject,
} from "../transport/SpeculosDmkTransport";

const tracer = new LocalTracer("live-dmk-tracer", { function: "useDeviceManagementKit" });

const stripTrailingSlashes = (value: string): string => {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
};

export const getMockServerTransportUrl = (): string =>
  stripTrailingSlashes(getEnv("MOCK_SERVER_TRANSPORT_URL"));

let instance: DeviceManagementKit | null = null;

let mockServerSessionToken: string | undefined;
export const setMockServerSessionToken = (token: string): void => {
  mockServerSessionToken = token;
};

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
    const userId = getEnv("USER_ID");
    const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;
    const mockServerTransportEnabled = getEnv("MOCK_SERVER_TRANSPORT");
    const mockServerUrl = getMockServerTransportUrl();
    tracer.trace("Initialize DeviceManagementKit", {
      firmwareDistributionSalt,
      mockServerTransportEnabled,
    });

    const builder = new DeviceManagementKitBuilder()
      .addTransport(RNBleTransportFactory)
      .addTransport(RNHidTransportFactory)
      .addTransport(httpProxyTransportFactory(httpProxyUrlSubject))
      .addTransport(speculosDmkTransportFactory(speculosTargetSubject))
      .addLogger(new LedgerLiveLogger(LogLevel.Debug))
      .addConfig({ firmwareDistributionSalt });

    if (mockServerTransportEnabled) {
      const webSocketUrl = getMockScriptRunnerBaseUrl(mockServerUrl, mockServerSessionToken);
      builder
        .addTransport(mockserverTransportFactory(mockServerUrl, mockServerSessionToken))
        .addConfig({ mockUrl: mockServerUrl, ...(webSocketUrl ? { webSocketUrl } : {}) });
    }

    instance = builder.build();
  }
  return instance;
};

const DeviceManagementKitContext = createContext<DeviceManagementKit | null>(null);

type Props = {
  children: React.ReactNode;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({ children }) => {
  tracer.trace("DeviceManagementKitProvider render");

  const deviceManagementKit = useMemo(() => {
    return getDeviceManagementKit();
  }, []);

  if (deviceManagementKit === null) {
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
