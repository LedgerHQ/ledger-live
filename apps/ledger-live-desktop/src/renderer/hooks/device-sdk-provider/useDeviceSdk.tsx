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

export const useDeviceSessionState = (): DeviceSessionState | undefined => {
  const deviceSdk = useDeviceSdk();
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [deviceSessionState, setDeviceSessionState] = useState<DeviceSessionState>();

  useEffect(() => {
    const sub = sessionIdSubject.subscribe({
      next: sessionId => {
        setSessionId(sessionId);
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

const sessionIdSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<
  string | undefined
>(undefined);

export class SdkTransport extends Transport {
  readonly sessionId: string | undefined;
  readonly sdk: DeviceSdk;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(sdk: DeviceSdk, sessionId?: string, ...args: any[]) {
    super(...args);
    this.sessionId = sessionId;
    this.sdk = sdk;
  }

  static async open(): Promise<SdkTransport> {
    const sessionId = await firstValueFrom(sessionIdSubject);
    console.log("[SDKTransport][open] sessionId", sessionId);
    if (sessionId) {
      console.log("[SDKTransport][open] existing sessionId", sessionId);
      console.log("[SDKTransport][open] starting discovering");
      const state = await firstValueFrom(deviceSdk.getDeviceSessionState({ sessionId }));
      if (state.deviceStatus !== DeviceStatus.NOT_CONNECTED) {
        return new SdkTransport(deviceSdk, sessionId);
      }
    }

    const device = await firstValueFrom(deviceSdk.startDiscovering());
    const connectedSessionId = await deviceSdk.connect({ deviceId: device.id });
    console.log("[SDKTransport][open] connected");
    sessionIdSubject.next(connectedSessionId);
    return new SdkTransport(deviceSdk, sessionId);
  }

  close: () => Promise<void> = () => Promise.resolve();

  async exchange(apdu: Buffer): Promise<Buffer> {
    if (!this.sessionId) {
      throw new Error("No session ID");
    }
    console.log("[SDKTransport][exchange] apdu", apdu);
    const apduUint8Array = new Uint8Array(apdu);
    console.log("[SDKTransport][exchange] apduUint8Array", apduUint8Array);
    const apduResponse = await this.sdk.sendApdu({
      sessionId: this.sessionId,
      apdu: apduUint8Array,
    });
    console.log("[SDKTransport][exchange] apduResponse", apduResponse);
    const response = Buffer.from([...apduResponse.data, ...apduResponse.statusCode]);
    console.log("[SDKTransport][exchange] response", response);
    return response;
  }
}
