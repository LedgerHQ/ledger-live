import React, { createContext, useContext, useMemo } from "react";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { LedgerLiveLogger } from "@ledgerhq/live-dmk-shared";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

let instance: DeviceManagementKit | null = null;

export const getDeviceManagementKit = (): DeviceManagementKit => {
  if (!instance) {
    instance = new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory)
      .addLogger(new LedgerLiveLogger(LogLevel.Debug))
      .build();
  }

  return instance;
};

export const DeviceManagementKitContext = createContext<DeviceManagementKit | null>(null);

type Props = {
  children: React.ReactNode;
  disabled?: boolean;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({ children, disabled }) => {
  const ldmkTransportFlag = !disabled && !!useFeature("ldmkTransport")?.enabled;

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
