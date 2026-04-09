import React, { createContext, useContext, useMemo } from "react";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { getDeviceManagementKit } from "../config/dmkInstance";

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

export const useDeviceManagementKit = (): DeviceManagementKit | null =>
  useContext(DeviceManagementKitContext);
