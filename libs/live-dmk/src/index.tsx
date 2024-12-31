import React, { createContext, useContext, useEffect, useState } from "react";
import Transport from "@ledgerhq/hw-transport";
import {
  DeviceManagementKitBuilder,
  ConsoleLogger,
  DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
  LogLevel,
  DiscoveredDevice,
  DeviceModelId,
} from "@ledgerhq/device-management-kit";
import {
  WebHidSendReportError,
  webHidTransportFactory,
} from "@ledgerhq/device-transport-kit-web-hid";
import { DescriptorEvent, DeviceModelId as DeviceModelIdTypes } from "@ledgerhq/types-devices";
import { BehaviorSubject, firstValueFrom, map, Observer, pairwise, startWith } from "rxjs";
import { LocalTracer } from "@ledgerhq/logs";
import { DeviceBusyError } from "@ledgerhq/device-management-kit/src/internal/device-session/model/Errors.js";

const deviceManagementKit = new DeviceManagementKitBuilder()
  .addTransport(webHidTransportFactory)
  .addLogger(new ConsoleLogger(LogLevel.Debug))
  .build();

export const DeviceManagementKitContext = createContext<DeviceManagementKit>(deviceManagementKit);

type Props = {
  children: React.ReactNode;
};

export const DeviceManagementKitProvider: React.FC<Props> = ({ children }) => (
  <DeviceManagementKitContext.Provider value={deviceManagementKit}>
    {children}
  </DeviceManagementKitContext.Provider>
);

export const useDeviceManagementKit = (): DeviceManagementKit =>
  useContext(DeviceManagementKitContext);

export const useDeviceSessionState = (): DeviceSessionState | undefined => {
  const sdk = useDeviceManagementKit();
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

export const useDeviceSessionRefresherToggle = (ff: boolean) => {
  const sdk = useDeviceManagementKit();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!ff) return;
    const sub = activeDeviceSessionSubject.subscribe({
      next: session => {
        if (session) {
          if (sessionId !== session.sessionId) {
            if (sessionId) {
              sdk.toggleDeviceSessionRefresher({
                sessionId: sessionId,
                enabled: true,
              });
            }

            setSessionId(session.sessionId);
            sdk.toggleDeviceSessionRefresher({
              sessionId: session.sessionId,
              enabled: false,
            });
          }
        }
      },
    });

    return () => {
      if (!ff) return;
      sub.unsubscribe();
      if (sessionId) {
        sdk.toggleDeviceSessionRefresher({
          sessionId: sessionId,
          enabled: true,
        });
      }
    };
  }, []);
};

export const isAllowedOnboardingStatePollingErrorDmk = (error: unknown): boolean => {
  if (error) {
    if (error instanceof WebHidSendReportError || error instanceof DeviceBusyError) {
      return true;
    }
  }

  return false;
};

const activeDeviceSessionSubject: BehaviorSubject<{
  sessionId: string;
  transport: DeviceManagementKitTransport;
} | null> = new BehaviorSubject<{
  sessionId: string;
  transport: DeviceManagementKitTransport;
} | null>(null);

const tracer = new LocalTracer("live-dmk", { function: "DeviceManagementKitTransport" });

export class DeviceManagementKitTransport extends Transport {
  readonly sessionId: string;
  readonly sdk: DeviceManagementKit;

  constructor(sdk: DeviceManagementKit, sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.sdk = sdk;
    this.listenToDisconnect();
  }

  listenToDisconnect = () => {
    const subscription = this.sdk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state: { deviceStatus: any }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          tracer.trace("[listenToDisconnect] Device disconnected, closing transport");
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
        tracer.trace("[listenToDisconnect] Complete");
        this.emit("disconnect");
        subscription.unsubscribe();
      },
    });
  };

  static async open(): Promise<DeviceManagementKitTransport> {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;

    if (activeSessionId) {
      tracer.trace(`[open] checking existing session ${activeSessionId}`);
      const deviceSessionState: DeviceSessionState | null = await firstValueFrom(
        deviceManagementKit.getDeviceSessionState({ sessionId: activeSessionId }),
      ).catch(e => {
        console.error("[SDKTransport][open] error getting device session state", e);
        return null;
      });

      if (deviceSessionState?.deviceStatus !== DeviceStatus.NOT_CONNECTED) {
        tracer.trace("[open] reusing existing session and instantiating a new SdkTransport");
        return activeDeviceSessionSubject.value.transport;
      }
    }

    tracer.trace("[open] No active session found, starting discovery");
    const [discoveredDevice] = await firstValueFrom(deviceManagementKit.listenToKnownDevices());
    const connectedSessionId = await deviceManagementKit.connect({ device: discoveredDevice });

    tracer.trace("[open] Connected");
    const transport = new DeviceManagementKitTransport(deviceManagementKit, connectedSessionId);
    activeDeviceSessionSubject.next({ sessionId: connectedSessionId, transport });

    return transport;
  }

  static listen = (observer: Observer<DescriptorEvent<string>>) => {
    const subscription = deviceManagementKit
      .listenToKnownDevices()
      .pipe(
        startWith<DiscoveredDevice[]>([]),
        pairwise(),
        map(([prev, curr]) => {
          const added = curr.filter(item => !prev.some(prevItem => prevItem.id === item.id));
          const removed = prev.filter(item => !curr.some(currItem => currItem.id === item.id));
          return { added, removed };
        }),
      )
      .subscribe({
        next: ({ added, removed }) => {
          for (const device of added) {
            const id =
              device.deviceModel.model === DeviceModelId.FLEX
                ? DeviceModelIdTypes.europa // Still called europa in LL codebase
                : device.deviceModel.model;
            tracer.trace(`[listen] device added ${device.deviceModel.model}`);
            observer.next({
              type: "add",
              descriptor: "",
              device: device,
              deviceModel: {
                // @ts-expect-error types are not matching
                id,
                type: device.transport,
              },
            });
          }

          for (const device of removed) {
            tracer.trace(`[listen] device removed ${device.deviceModel.model}`);
            observer.next({
              type: "remove",
              descriptor: "",
              device: device,
              deviceModel: {
                // @ts-expect-error types are not matching
                id: device.deviceModel.model,
                type: device.transport,
              },
            });
          }
        },
        error: observer.error,
        complete: observer.complete,
      });

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  };

  close: () => Promise<void> = () => Promise.resolve();

  async exchange(apdu: Buffer): Promise<Buffer> {
    tracer.trace(`[exchange] => ${apdu.toString("hex")}`);
    return await this.sdk
      .sendApdu({
        sessionId: this.sessionId,
        apdu: new Uint8Array(apdu),
      })
      .then((apduResponse: { data: Uint8Array; statusCode: Uint8Array }): Buffer => {
        const response = Buffer.from([...apduResponse.data, ...apduResponse.statusCode]);
        tracer.trace(`[exchange] <= ${response.toString("hex")}`);
        return response;
      })
      .catch(e => {
        console.error("[exchange] error", e);
        throw e;
      });
  }
}
