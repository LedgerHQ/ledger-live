import React, { createContext, useContext, useMemo } from "react";
import {
  DeviceManagementKitBuilder,
  DeviceManagementKit,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { RNBleTransportFactory } from "@ledgerhq/device-transport-kit-react-native-ble";
import { LedgerLiveLogger, UserHashService } from "@ledgerhq/live-dmk-shared";
import { RNHidTransportFactory } from "@ledgerhq/device-transport-kit-react-native-hid";
import { getEnv } from "@ledgerhq/live-env";
import { LocalTracer } from "@ledgerhq/logs";

const tracer = new LocalTracer("live-dmk-tracer", { function: "useDeviceManagementKit" });

let instance: DeviceManagementKit | null = null;

export const getDeviceManagementKit = (): DeviceManagementKit => {
  if (!instance) {
    const userId = getEnv("USER_ID");
    const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;
    tracer.trace("Initialize DeviceManagementKit", {
      firmwareDistributionSalt,
    });
    instance = new DeviceManagementKitBuilder()
      .addTransport(RNBleTransportFactory)
      .addTransport(RNHidTransportFactory)
      .addLogger(new LedgerLiveLogger(LogLevel.Debug))
      .addConfig({ firmwareDistributionSalt })
      .build();
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
