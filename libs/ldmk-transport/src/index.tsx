import React, { createContext, useContext, useEffect, useState } from "react";
import Transport from "@ledgerhq/hw-transport";
import {
  DeviceSdkBuilder,
  ConsoleLogger,
  type DeviceSdk,
  type DeviceSessionState,
  DeviceStatus,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { BehaviorSubject, firstValueFrom } from "rxjs";

const deviceSdk = new DeviceSdkBuilder().addLogger(new ConsoleLogger(LogLevel.Debug)).build();

export const DeviceSdkContext = createContext<DeviceSdk>(deviceSdk);

type Props = {
  children: React.ReactNode;
};

export const DeviceSdkProvider: React.FC<Props> = ({ children }) => (
  <DeviceSdkContext.Provider value={deviceSdk}>{children}</DeviceSdkContext.Provider>
);

export const useDeviceSdk = (): DeviceSdk => useContext(DeviceSdkContext);

export const useDeviceSessionState = (): DeviceSessionState | undefined => {
  const sdk = useDeviceSdk();
  const [sessionState, setSessionState] = useState<DeviceSessionState | undefined>(undefined);

  useEffect(() => {
    const subscription = activeDeviceSessionSubject.subscribe({
      next: session => {
        if (!session) {
          setSessionState(undefined);
        } else {
          const { sessionId } = session;
          const stateSubscription = sdk.getDeviceSessionState({ sessionId }).subscribe({
            next: (state: { deviceStatus: any }) => {
              state.deviceStatus !== DeviceStatus.NOT_CONNECTED
                ? setSessionState(state)
                : setSessionState(undefined);
            },
            error: (error: any) => console.error("[useDeviceSessionState] error", error),
          });
          return () => stateSubscription.unsubscribe();
        }
      },
      error: error => console.error("[useDeviceSessionState] subscription error", error),
    });

    return () => subscription.unsubscribe();
  }, [sdk]);

  return sessionState;
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
      next: (state: { deviceStatus: any }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          console.log(
            "[SDKTransport][listenToDisconnect] device not connected, session ended, closing transport",
          );
          activeDeviceSessionSubject.next(null);
          this.emit("disconnect");
        }
      },
      error: (error: any) => {
        console.error("[SDKTransport][listenToDisconnect] error", error);
        this.emit("disconnect");
        subscription.unsubscribe();
      },
      complete: () => {
        console.log("[SDKTransport][listenToDisconnect] complete");
        this.emit("disconnect");
        subscription.unsubscribe();
      },
    });
  };

  static async open(): Promise<DeviceManagementKitTransport> {
    console.log("[SDKTransport][open]");
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;

    if (activeSessionId) {
      console.log("[SDKTransport][open] checking existing session", activeSessionId);
      const deviceSessionState: DeviceSessionState | null = await firstValueFrom(
        deviceSdk.getDeviceSessionState({ sessionId: activeSessionId }),
      ).catch(e => console.error("[SDKTransport][open] error getting device session state", e));

      if (deviceSessionState?.deviceStatus !== DeviceStatus.NOT_CONNECTED) {
        console.log(
          "[SDKTransport][open] reusing existing session and instantiating a new SdkTransport",
        );
        return activeDeviceSessionSubject.value.transport;
      }
    }

    console.log("[SDKTransport][open] no active session found, starting discovery");
    const discoveredDevice: { id: string } = await firstValueFrom(deviceSdk.startDiscovering());
    const connectedSessionId = await deviceSdk.connect({ deviceId: discoveredDevice.id });

    console.log("[SDKTransport][open] connected");
    const transport = new DeviceManagementKitTransport(deviceSdk, connectedSessionId);
    activeDeviceSessionSubject.next({ sessionId: connectedSessionId, transport });

    return transport;
  }

  close: () => Promise<void> = () => Promise.resolve();

  async exchange(apdu: Buffer): Promise<Buffer> {
    console.log("[SDKTransport][exchange] =>", apdu);
    return await this.sdk
      .sendApdu({
        sessionId: this.sessionId,
        apdu: new Uint8Array(apdu),
      })
      .then((apduResponse: { data: number[]; statusCode: number[] }): Buffer => {
        const response = Buffer.from([...apduResponse.data, ...apduResponse.statusCode]);
        console.log("[SDKTransport][exchange] <=", response);
        return response;
      });
  }
}
