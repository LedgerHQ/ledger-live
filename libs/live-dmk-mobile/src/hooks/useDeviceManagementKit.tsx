import React, { createContext, useContext } from "react";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { RNBleTransportFactory } from "@ledgerhq/device-transport-kit-react-native-ble";
import { LedgerLiveLogger } from "@ledgerhq/live-dmk-shared";

export const deviceManagementKit = new DeviceManagementKitBuilder()
  .addTransport(RNBleTransportFactory)
  .addLogger(new LedgerLiveLogger(LogLevel.Debug))
  .build();

export const DeviceManagementKitContext = createContext<DeviceManagementKit>(deviceManagementKit);

type Props = {
  children: React.ReactNode;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({ children }) => (
  <DeviceManagementKitContext.Provider value={deviceManagementKit}>
    {children}
  </DeviceManagementKitContext.Provider>
);

export const useDeviceManagementKit = (): DeviceManagementKit =>
  useContext(DeviceManagementKitContext);
