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
import {
  DevToolsLogger,
  DevToolsDmkInspector,
} from "@ledgerhq/device-management-kit-devtools-core";
import {
  RozeniteConnector,
  useRozeniteConnector,
} from "@ledgerhq/device-management-kit-devtools-rozenite";

const tracer = new LocalTracer("live-dmk-tracer", { function: "useDeviceManagementKit" });

let instance: DeviceManagementKit | null = null;

export const getDeviceManagementKit = (): DeviceManagementKit => {
  if (!instance) {
    const userId = getEnv("USER_ID");
    const firmwareDistributionSalt = UserHashService.compute(userId).firmwareSalt;
    tracer.trace("Initialize DeviceManagementKit", {
      firmwareDistributionSalt,
    });

    // Create the Rozenite devtools connector (shared between logger and inspector)
    const connector = RozeniteConnector.getInstance();

    // Create the devtools logger
    const devToolsLogger = new DevToolsLogger(connector);

    instance = new DeviceManagementKitBuilder()
      .addTransport(RNBleTransportFactory)
      .addTransport(RNHidTransportFactory)
      .addLogger(new LedgerLiveLogger(LogLevel.Debug))
      .addLogger(devToolsLogger)
      .addConfig({ firmwareDistributionSalt })
      .build();

    // Enable inspector for device sessions and DMK interaction (must be after build)
    new DevToolsDmkInspector(connector, instance);
  }
  return instance;
};

const DeviceManagementKitContext = createContext<DeviceManagementKit | null>(null);

type Props = {
  children: React.ReactNode;
  dmkEnabled: boolean;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({ children, dmkEnabled }) => {
  tracer.trace("DeviceManagementKitProvider render", { dmkEnabled });

  useRozeniteConnector();

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
