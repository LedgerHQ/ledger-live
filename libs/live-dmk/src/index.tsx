import React, { createContext, useContext, useEffect, useState } from "react";
import Transport from "@ledgerhq/hw-transport";
import {
  DeviceManagementKitBuilder,
  ConsoleLogger,
  type DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
  LogLevel,
} from "@ledgerhq/device-management-kit";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { LocalTracer } from "@ledgerhq/logs";

const deviceSdk = new DeviceManagementKitBuilder()
  .addLogger(new ConsoleLogger(LogLevel.Debug))
  .build();

export const DeviceSdkContext = createContext<DeviceManagementKit>(deviceSdk);

type Props = {
  children: React.ReactNode;
};

export const DeviceSdkProvider: React.FC<Props> = ({ children }) => (
  <DeviceSdkContext.Provider value={deviceSdk}>{children}</DeviceSdkContext.Provider>
);

export const useDeviceSdk = (): DeviceManagementKit => useContext(DeviceSdkContext);

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
            next: (state: DeviceSessionState) => {
              state.deviceStatus !== DeviceStatus.NOT_CONNECTED
                ? setSessionState(state)
                : setSessionState(undefined);
            },
            error: (error: Error) => console.error("[useDeviceSessionState] error", error),
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
  readonly sdk: DeviceManagementKit;

  constructor(sdk: DeviceManagementKit, sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.sdk = sdk;
    this.listenToDisconnect();
    this.tracer = new LocalTracer("live-dmdk", { function: "DeviceManagementKitTransport" });
  }

  listenToDisconnect = () => {
    const subscription = this.sdk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state: { deviceStatus: any }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          this.tracer.trace("[listenToDisconnect] Device disconnected, closing transport");
          activeDeviceSessionSubject.next(null);
          this.emit("disconnect");
        }
      },
      error: (error: any) => {
        console.error("[listenToDisconnect] error", error);
        this.emit("disconnect");
        subscription.unsubscribe();
      },
      complete: () => {
        this.tracer.trace("[listenToDisconnect] Complete");
        this.emit("disconnect");
        subscription.unsubscribe();
      },
    });
  };

  async open(): Promise<DeviceManagementKitTransport> {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;

    if (activeSessionId) {
      this.tracer.trace(`[open] checking existing session ${activeSessionId}`);
      const deviceSessionState: DeviceSessionState | null = await firstValueFrom(
        deviceSdk.getDeviceSessionState({ sessionId: activeSessionId }),
      ).catch(e => {
        console.error("[SDKTransport][open] error getting device session state", e);
        return null;
      });

      if (deviceSessionState?.deviceStatus !== DeviceStatus.NOT_CONNECTED) {
        this.tracer.trace("[open] reusing existing session and instantiating a new SdkTransport");
        return activeDeviceSessionSubject.value.transport;
      }
    }

    this.tracer.trace("[open] No active session found, starting discovery");
    const [discoveredDevice] = await firstValueFrom(deviceSdk.listenToKnownDevices());
    const connectedSessionId = await deviceSdk.connect({ device: discoveredDevice });

    this.tracer.trace("[open] Connected");
    const transport = new DeviceManagementKitTransport(deviceSdk, connectedSessionId);
    activeDeviceSessionSubject.next({ sessionId: connectedSessionId, transport });

    return transport;
  }

  close: () => Promise<void> = () => Promise.resolve();

  async exchange(apdu: Buffer): Promise<Buffer> {
    this.tracer.trace(`[exchange] => ${apdu}`);
    return await this.sdk
      .sendApdu({
        sessionId: this.sessionId,
        apdu: new Uint8Array(apdu),
      })
      .then((apduResponse: { data: Uint8Array; statusCode: Uint8Array }): Buffer => {
        const response = Buffer.from([...apduResponse.data, ...apduResponse.statusCode]);
        this.tracer.trace(`[exchange] <= ${response}`);
        return response;
      });
  }
}
