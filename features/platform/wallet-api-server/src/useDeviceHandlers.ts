import { useCallback, useEffect, useMemo, useRef } from "react";
import semver from "semver";
import { first, type Subject } from "rxjs";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";

/** The APDU exchange with an opened device, as the host's transport subject carries it. */
export type DeviceTransportEvent =
  | { type: "input-frame"; apduHex: string }
  | { type: "device-request"; data: string }
  | { type: "device-response"; data: string }
  | { type: "error"; error: unknown };

/** Opens the device with this id for raw APDUs; completing the subject closes it. */
export type OpenDeviceTransport = (deviceId: string) => Subject<DeviceTransportEvent>;

/** What the host's device picker reports. */
export type DevicePicked = {
  device?: { deviceId: string; modelId: string } | null;
  appAndVersion?: { version: string } | null;
};

type DevicePicker = (params: {
  appName: string | undefined;
  onSuccess: (result: DevicePicked) => void;
  onCancel: () => void;
}) => void;

type DeviceTrackingEvent =
  | "deviceTransportRequested"
  | "deviceTransportSuccess"
  | "deviceTransportFail"
  | "deviceSelectRequested"
  | "deviceSelectSuccess"
  | "deviceSelectFail"
  | "deviceOpenRequested"
  | "deviceExchangeRequested"
  | "deviceExchangeSuccess"
  | "deviceExchangeFail"
  | "deviceCloseRequested"
  | "deviceCloseSuccess";

export type DeviceTracking<Manifest> = Record<DeviceTrackingEvent, (manifest: Manifest) => void>;

export type DeviceHandlersOptions<Manifest> = {
  /** A device opened in one session is not handed over to the next one. */
  session: unknown;
  manifest: Manifest;
  tracking: DeviceTracking<Manifest>;
  openDevice: OpenDeviceTransport;
  pickers: { "device.transport"?: DevicePicker; "device.select"?: DevicePicker };
};

type PickRequest = { appVersionRange?: string; devices?: string[] };

/** Why a picked device does not fit the request, if it does not. */
function rejectionOf({ device, appAndVersion }: DevicePicked, request: PickRequest) {
  if (!device) return "No device";
  if (request.devices && !request.devices.includes(device.modelId)) {
    return "Device not in the devices list";
  }
  // Kept as live-common had it: a version in the range is the one rejected.
  if (
    request.appVersionRange &&
    appAndVersion &&
    semver.satisfies(appAndVersion.version, request.appVersionRange)
  ) {
    return "App version doesn't satisfies the range";
  }
  return undefined;
}

/** The `device.*` handlers: one raw transport per session, closed when the session changes or ends. */
export function useDeviceHandlers<Manifest>({
  session,
  manifest,
  tracking,
  openDevice,
  pickers,
}: DeviceHandlersOptions<Manifest>): Partial<WalletHandlers> {
  const ref = useRef<Subject<DeviceTransportEvent> | undefined>(undefined);

  const subscribe = useCallback(
    (deviceId: string) => {
      const subject = openDevice(deviceId);
      ref.current = subject;
      subject.subscribe({
        complete: () => {
          if (ref.current === subject) ref.current = undefined;
        },
      });
    },
    [openDevice],
  );

  useEffect(() => () => ref.current?.complete(), [session]);

  const transportPicker = pickers["device.transport"];
  const selectPicker = pickers["device.select"];

  return useMemo(() => {
    const pick = (
      picker: DevicePicker,
      request: PickRequest & { appName?: string },
      events: {
        requested: DeviceTrackingEvent;
        success: DeviceTrackingEvent;
        fail: DeviceTrackingEvent;
      },
      onPicked: (deviceId: string) => string,
    ) =>
      new Promise<string>((resolve, reject) => {
        if (ref.current) {
          reject(new Error("Device already opened"));
          return;
        }
        tracking[events.requested](manifest);
        let done = false;
        picker({
          appName: request.appName,
          onSuccess: picked => {
            if (done) return;
            done = true;
            tracking[events.success](manifest);
            const rejection = rejectionOf(picked, request);
            if (rejection || !picked.device) {
              reject(new Error(rejection));
              return;
            }
            resolve(onPicked(picked.device.deviceId));
          },
          onCancel: () => {
            if (done) return;
            done = true;
            tracking[events.fail](manifest);
            reject(new Error("User cancelled"));
          },
        });
      });

    const handlers: Partial<WalletHandlers> = {
      "device.open": ({ deviceId }) => {
        if (ref.current) return Promise.reject(new Error("Device already opened"));
        tracking.deviceOpenRequested(manifest);
        subscribe(deviceId);
        return "1";
      },

      "device.exchange": ({ apduHex }) => {
        const subject = ref.current;
        if (!subject) return Promise.reject(new Error("No device opened"));
        tracking.deviceExchangeRequested(manifest);
        return new Promise((resolve, reject) => {
          subject.pipe(first(e => e.type === "device-response" || e.type === "error")).subscribe({
            next: event => {
              if (event.type === "device-response") {
                tracking.deviceExchangeSuccess(manifest);
                resolve(event.data);
              } else if (event.type === "error") {
                tracking.deviceExchangeFail(manifest);
                reject(event.error || new Error("deviceExchange: unknown error"));
              }
            },
            error: error => {
              tracking.deviceExchangeFail(manifest);
              reject(error);
            },
          });
          subject.next({ type: "input-frame", apduHex });
        });
      },

      "device.close": ({ transportId }) => {
        if (!ref.current) return Promise.reject(new Error("No device opened"));
        tracking.deviceCloseRequested(manifest);
        ref.current.complete();
        tracking.deviceCloseSuccess(manifest);
        return Promise.resolve(transportId);
      },
    };

    if (transportPicker) {
      handlers["device.transport"] = request =>
        pick(
          transportPicker,
          request,
          {
            requested: "deviceTransportRequested",
            success: "deviceTransportSuccess",
            fail: "deviceTransportFail",
          },
          deviceId => {
            subscribe(deviceId);
            return "1";
          },
        );
    }

    if (selectPicker) {
      handlers["device.select"] = request =>
        pick(
          selectPicker,
          request,
          {
            requested: "deviceSelectRequested",
            success: "deviceSelectSuccess",
            fail: "deviceSelectFail",
          },
          deviceId => deviceId,
        );
    }

    return handlers;
  }, [manifest, selectPicker, subscribe, tracking, transportPicker]);
}
