import React, { createContext, useContext, useMemo } from "react";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { RNBleTransportFactory } from "@ledgerhq/device-transport-kit-react-native-ble";
import { LedgerLiveLogger } from "@ledgerhq/live-dmk-shared";

let instance: DeviceManagementKit | null = null;

export const getDeviceManagementKit = (): DeviceManagementKit => {
  if (!instance) {
    instance = new DeviceManagementKitBuilder()
      .addTransport(RNBleTransportFactory)
      .addLogger(new LedgerLiveLogger(LogLevel.Debug))
      .build();
  }

  return instance;
};

const DeviceManagementKitContext = createContext<DeviceManagementKit | null>(null);

type Props = {
  children: React.ReactNode;
  dmkEnabled: boolean;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({ children, dmkEnabled }) => {
  const deviceManagementKit = useMemo(() => {
    if (!dmkEnabled) return null;
    return getDeviceManagementKit();
  }, [dmkEnabled]);

  if (!dmkEnabled || deviceManagementKit === null) {
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

export const useDeviceManagementKitEnabled = (): boolean => {
  const deviceManagementKit = useDeviceManagementKit();
  return !!deviceManagementKit;
};
