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
import { httpProxyTransportFactory, httpProxyUrlSubject } from "../transport/HttpProxyDmkTransport";
import {
  speculosDmkTransportFactory,
  speculosTargetSubject,
} from "../transport/SpeculosDmkTransport";

const tracer = new LocalTracer("live-dmk-tracer", { function: "useDeviceManagementKit" });

let instance: DeviceManagementKit | null = null;

/**
 * Firmware distribution salt of the current user, which selects their progressive OS rollout.
 * The app sets it whenever the user ID is known or changes, via {@link setFirmwareDistributionSalt}.
 */
let firmwareDistributionSalt: string | undefined;

export const getDeviceManagementKit = (): DeviceManagementKit => {
  if (!instance) {
    tracer.trace("Initialize DeviceManagementKit", {
      firmwareDistributionSalt,
    });
    instance = new DeviceManagementKitBuilder()
      .addTransport(RNBleTransportFactory)
      .addTransport(RNHidTransportFactory)
      .addTransport(httpProxyTransportFactory(httpProxyUrlSubject))
      .addTransport(speculosDmkTransportFactory(speculosTargetSubject))
      .addLogger(new LedgerLiveLogger(LogLevel.Debug))
      .addConfig(firmwareDistributionSalt ? { firmwareDistributionSalt } : {})
      .build();
  }
  return instance;
};

/** Applies to the DMK built next, and to the current one if it already exists. */
export const setFirmwareDistributionSalt = (salt: string): void => {
  firmwareDistributionSalt = salt;
  instance?.setFirmwareDistributionSalt(salt);
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
