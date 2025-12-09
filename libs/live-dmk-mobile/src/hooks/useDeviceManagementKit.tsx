import React, { createContext, useContext, useMemo } from "react";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { RNBleTransportFactory } from "@ledgerhq/device-transport-kit-react-native-ble";
import { LedgerLiveLogger } from "@ledgerhq/live-dmk-shared";
import { RNHidTransportFactory } from "@ledgerhq/device-transport-kit-react-native-hid";
import { LocalTracer } from "@ledgerhq/logs";
const tracer = new LocalTracer("live-dmk-tracer", { function: "useDeviceManagementKit" });

export const getDeviceManagementKit = (): DeviceManagementKit => {
  // Use FIRMWARE_SALT from environment variable
  const firmwareSalt = typeof process !== "undefined" && process.env?.FIRMWARE_SALT;
  if (!firmwareSalt) {
    throw new Error("FIRMWARE_SALT environment variable is required");
  }
  const firmwareDistributionSalt = firmwareSalt;
  tracer.trace("Initialize DeviceManagementKit", {
    firmwareDistributionSalt,
  });
  return new DeviceManagementKitBuilder()
      .addTransport(RNBleTransportFactory)
      .addTransport(RNHidTransportFactory)
      .addLogger(new LedgerLiveLogger(LogLevel.Debug))
      .addConfig({ firmwareDistributionSalt })
      .build();
};

const DeviceManagementKitContext = createContext<DeviceManagementKit | null>(null);

type Props = {
  children: React.ReactNode;
  dmkEnabled: boolean;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({ children, dmkEnabled }) => {
  tracer.trace("DeviceManagementKitProvider render", { dmkEnabled });

  const deviceManagementKit = useMemo(() => {
    if (!dmkEnabled) {
      tracer.trace("DMK is disabled inside useMemo, returning null", { dmkEnabled });
      return null;
    }
    return getDeviceManagementKit();
  }, [dmkEnabled]);

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

export const useDeviceManagementKitEnabled = (): boolean => {
  const deviceManagementKit = useDeviceManagementKit();
  return !!deviceManagementKit;
};
