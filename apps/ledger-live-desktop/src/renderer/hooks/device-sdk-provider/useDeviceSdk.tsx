import React, { createContext, useContext, useEffect, useState } from "react";
import Transport from "@ledgerhq/hw-transport";
import {
  DeviceSdkBuilder,
  ConsoleLogger,
  type DeviceSdk,
  type DeviceSessionState,
  DeviceStatus,
  LogLevel,
} from "@ledgerhq/device-sdk-core";
import { BehaviorSubject, firstValueFrom } from "rxjs";

const deviceSdk = new DeviceSdkBuilder().addLogger(new ConsoleLogger(LogLevel.Debug)).build();

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

export const useDeviceSessionState = (): DeviceSessionState | undefined => {
  const deviceSdk = useDeviceSdk();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [deviceSessionState, setDeviceSessionState] = useState<DeviceSessionState>();

  useEffect(() => {
    const sub = activeDeviceSessionSubject.subscribe({
      next: val => {
        if (!val) setSessionId(null);
        else setSessionId(val?.sessionId);
      },
      error: error => {
        console.error("[useDeviceSessionState] error", error);
      },
    });

    return () => sub.unsubscribe();
  }, []);

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

const activeDeviceSessionSubject: BehaviorSubject<{
  sessionId: string;
  transport: DeviceManagementKitTransport;
} | null> = new BehaviorSubject<{
  sessionId: string;
  transport: DeviceManagementKitTransport;
} | null>(null);

export class DeviceManagementKitTransport extends Transport {
  readonly sessionId: string;
  readonly sdk: DeviceSdk;

  constructor(sdk: DeviceSdk, sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.sdk = sdk;
    this.listenToDisconnect();
  }

  listenToDisconnect = () => {
    const subscription = this.sdk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: state => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          console.log(
            "[SDKTransport][listenToDisconnect] device not connected, session ended, closing transport",
          );
          activeDeviceSessionSubject.next(null);
          this.emit("disconnect");
        }
      },
      complete: () => {
        console.log("[SDKTransport][listenToDisconnect] complete");
        subscription.unsubscribe();
      },
    });
  };

  static async open(): Promise<DeviceManagementKitTransport> {
    console.log("[SDKTransport][open]");
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;
    if (activeSessionId) {
      console.log("[SDKTransport][open] checking existing session", activeSessionId);
      let deviceSessionState: DeviceSessionState | null = null;
      try {
        deviceSessionState = await firstValueFrom(
          deviceSdk.getDeviceSessionState({ sessionId: activeSessionId }),
        );
      } catch (e) {
        console.error("[SDKTransport][open] error getting device session state", e);
      }
      if (deviceSessionState?.deviceStatus !== DeviceStatus.NOT_CONNECTED) {
        console.log(
          "[SDKTransport][open] reusing existing session and instantiating a new SdkTransport",
        );
        return activeDeviceSessionSubject.value.transport;
      }
    }

    console.log("[SDKTransport][open] no active session found, starting discovery");
    const discoveredDevice = await firstValueFrom(deviceSdk.startDiscovering());
    const connectedSessionId = await deviceSdk.connect({ deviceId: discoveredDevice.id });
    console.log("[SDKTransport][open] connected");
    const transport = new DeviceManagementKitTransport(deviceSdk, connectedSessionId);
    activeDeviceSessionSubject.next({ sessionId: connectedSessionId, transport });
    return transport;
  }

  close: () => Promise<void> = () => Promise.resolve();

  async exchange(apdu: Buffer): Promise<Buffer> {
    console.log("[SDKTransport][exchange] =>", apdu);
    const apduUint8Array = new Uint8Array(apdu);
    const apduResponse = await this.sdk.sendApdu({
      sessionId: this.sessionId,
      apdu: apduUint8Array,
    });
    const response = Buffer.from([...apduResponse.data, ...apduResponse.statusCode]);
    console.log("[SDKTransport][exchange] <=", response);
    return response;
  }
}
