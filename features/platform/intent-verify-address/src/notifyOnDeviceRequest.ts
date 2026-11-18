import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { finalize, isObservable, type Observable } from "rxjs";
import type { NotifyDeviceRequest } from "./getAddressVerification";

const DEVICE_REQUEST_METHODS = new Set<PropertyKey>([
  "sendApdu",
  "sendCommand",
  "executeDeviceAction",
]);

const BOLOS_CLA = 0xb0;
const GET_APP_AND_VERSION_INS = 0x01;

class DeviceRequestAbortedError extends Error {
  override name = "DeviceRequestAbortedError";
  constructor() {
    super("The address verification was cancelled, so nothing more is sent to the device");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAppAndVersionQuery(cla: unknown, ins: unknown): boolean {
  return cla === BOLOS_CLA && ins === GET_APP_AND_VERSION_INS;
}

function isAppAndVersionApdu({ apdu }: Record<string, unknown>): boolean {
  return apdu instanceof Uint8Array && isAppAndVersionQuery(apdu[0], apdu[1]);
}

function isAppAndVersionCommand({ command }: Record<string, unknown>): boolean {
  if (!isRecord(command) || typeof command.getApdu !== "function") return false;

  try {
    const apdu: unknown = command.getApdu();
    return isRecord(apdu) && isAppAndVersionQuery(apdu.cla, apdu.ins);
  } catch {
    return false;
  }
}

/** A signer can query the app and version before it asks the device for anything else. */
function isAppAndVersionRequest(method: PropertyKey, options: unknown): boolean {
  if (!isRecord(options)) return false;
  if (method === "sendApdu") return isAppAndVersionApdu(options);

  return method === "sendCommand" && isAppAndVersionCommand(options);
}

type DeviceAction = Readonly<{ observable: Observable<unknown>; cancel: () => void }>;

function isDeviceAction(value: unknown): value is DeviceAction {
  return isRecord(value) && isObservable(value.observable) && typeof value.cancel === "function";
}

/** A signer kit consumes only the observable, so nobody else cancels the action on abort. */
function cancelOnAbort(action: unknown, signal: AbortSignal): unknown {
  if (!isDeviceAction(action)) return action;

  let isSettled = false;
  const stopListening = () => {
    isSettled = true;
    signal.removeEventListener("abort", cancel);
  };
  const cancel = () => {
    if (isSettled) return;
    stopListening();
    action.cancel();
  };
  signal.addEventListener("abort", cancel, { once: true });

  return { ...action, observable: action.observable.pipe(finalize(stopListening)), cancel };
}

/**
 * Wraps `dmk` so `onDeviceRequest` runs on the first request sent to the device that is not the
 * BOLOS app-and-version query, whether through a `DmkCompatTransport` (APDU) or a DMK signer kit
 * (device action). Once `signal` is aborted, any later request is rejected before it reaches the
 * device, and a running device action is cancelled.
 */
export function notifyOnDeviceRequest(
  dmk: DeviceManagementKit,
  onDeviceRequest: NotifyDeviceRequest,
  signal?: AbortSignal,
): DeviceManagementKit {
  return new Proxy(dmk, {
    get(target, property) {
      const value: unknown = Reflect.get(target, property, target);
      if (typeof value !== "function") return value;
      if (!DEVICE_REQUEST_METHODS.has(property)) return value.bind(target);

      return (...args: unknown[]) => {
        if (signal?.aborted) {
          const aborted = new DeviceRequestAbortedError();
          if (property === "executeDeviceAction") throw aborted;
          return Promise.reject(aborted);
        }
        if (!isAppAndVersionRequest(property, args[0])) onDeviceRequest();
        const request: unknown = value.apply(target, args);
        if (!signal || property !== "executeDeviceAction") return request;
        return cancelOnAbort(request, signal);
      };
    },
  });
}
