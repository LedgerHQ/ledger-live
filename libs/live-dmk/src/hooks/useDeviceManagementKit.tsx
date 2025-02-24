import React, { createContext, useContext } from "react";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { LedgerLiveLogger } from "../services/LedgerLiveLogger";

// TODO lower the level of the logger once useFeature("ldmkTransport") is removed and new transport goes to production
export const deviceManagementKit = new DeviceManagementKitBuilder()
  .addTransport(webHidTransportFactory)
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
