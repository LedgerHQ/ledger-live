import type { WithDevice } from "@ledgerhq/ledger-key-ring-protocol/types";
import type { KeyRingDeviceBridge, KeyRingDeviceSession } from "../../types";

/** How the v1 SDK reaches devices: the app's device access, and a transport per DMK session. */
export type V1DeviceBridge = Readonly<{
  withDevice: WithDevice;
  createSessionTransport: (deviceSession: KeyRingDeviceSession) => V1Transport;
}>;

/** The transport one v1 device job runs on. */
export type V1Transport = Parameters<Parameters<ReturnType<WithDevice>>[0]>[0];

/** Wraps `bridge` in the opaque value `createKeyRingClient` takes. */
export function toDeviceBridge(bridge: V1DeviceBridge): KeyRingDeviceBridge {
  const handle: KeyRingDeviceBridge = Object.freeze({ kind: "KeyRingDeviceBridge" });
  bridges.set(handle, bridge);
  return handle;
}

/** The v1 bridge behind `handle`. Throws on a bridge this package did not build. */
export function v1BridgeOf(handle: KeyRingDeviceBridge): V1DeviceBridge {
  const bridge = bridges.get(handle);
  if (!bridge) throw new Error("Unknown key ring device bridge");
  return bridge;
}

const bridges = new WeakMap<KeyRingDeviceBridge, V1DeviceBridge>();
