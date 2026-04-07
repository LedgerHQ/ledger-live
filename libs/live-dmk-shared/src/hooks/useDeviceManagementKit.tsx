import React, { createContext, useContext, useMemo } from "react";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { getDeviceManagementKit } from "../config/dmkInstance";

export const DeviceManagementKitContext = createContext<DeviceManagementKit | null>(null);

type Props = {
  children: React.ReactNode;
  disabled?: boolean;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({ children, disabled }) => {
  const deviceManagementKit = useMemo(() => {
    if (disabled) return null;
    return getDeviceManagementKit();
  }, [disabled]);

  if (disabled || deviceManagementKit === null) {
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
