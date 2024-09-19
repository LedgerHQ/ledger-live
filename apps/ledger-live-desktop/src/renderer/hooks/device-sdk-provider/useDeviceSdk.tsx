import React, { createContext, useContext, useEffect, useState } from "react";
import {
  DeviceSdkBuilder,
  ConsoleLogger,
  type DeviceSdk,
  type DeviceSessionState,
  DeviceStatus,
  LogLevel,
} from "@ledgerhq/device-sdk-core";

const deviceSdk = new DeviceSdkBuilder().addLogger(new ConsoleLogger(LogLevel.Info)).build();

export const DeviceSdkContext = createContext<DeviceSdk>(deviceSdk);

type Props = {
  children: React.ReactNode;
};

export const DeviceSdkProvider: React.FC<Props> = ({ children }) => {
  return <DeviceSdkContext.Provider value={deviceSdk}>{children}</DeviceSdkContext.Provider>;
};

export const useDeviceSdk = (): DeviceSdk => {
  return useContext(DeviceSdkContext);
};

export const useDeviceSessionState = (sessionId?: string): DeviceSessionState | undefined => {
  const deviceSdk = useDeviceSdk();
  const [deviceSessionState, setDeviceSessionState] = useState<DeviceSessionState>();

  useEffect(() => {
    if (!sessionId) return;

    const subscription = deviceSdk
      .getDeviceSessionState({
        sessionId,
      })
      .subscribe(state => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          console.log("device not connected");
        } else {
          setDeviceSessionState(state);
        }
      });

    return () => subscription.unsubscribe();
  }, [deviceSdk, sessionId]);

  return deviceSessionState;
};
