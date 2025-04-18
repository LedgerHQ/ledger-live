import React, { createContext, useContext, useMemo } from "react";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { RNBleTransportFactory } from "@ledgerhq/device-transport-kit-react-native-ble";
import { LedgerLiveLogger } from "@ledgerhq/live-dmk-shared";
import { useLdmkFeatureEnabled } from "../hooks/useLdmkFeatureEnabled";
import { RNHidTransportFactory } from "@ledgerhq/device-transport-kit-react-native-hid";

let instance: DeviceManagementKit | null = null;

export const getDeviceManagementKit = (): DeviceManagementKit => {
  if (!instance) {
    instance = new DeviceManagementKitBuilder()
      .addTransport(RNBleTransportFactory)
      .addTransport(RNHidTransportFactory)
      .addLogger(new LedgerLiveLogger(LogLevel.Debug))
      .build();
  }

  return instance;
};

const DeviceManagementKitContext = createContext<DeviceManagementKit | null>(null);

type Props = {
  children: React.ReactNode;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({ children }) => {
  const ldmkTransportFlag = useLdmkFeatureEnabled();

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
