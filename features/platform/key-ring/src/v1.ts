import type { KeyRingDeviceBridge } from "./types";
import { toDeviceBridge, type V1DeviceBridge } from "./internals/v1/deviceBridge";

/**
 * The device bridge of the v1 protocol adapter, for the composition root only: how the v1 SDK
 * reaches a device outside a DIE session (`withDevice`) and inside one (a transport on the DMK
 * session). The transport classes live in `libs/`, so the app builds them. A later protocol
 * adapter replaces this subpath; the rest of the app does not change.
 *
 * @example
 * ```ts
 * import { createKeyRingV1DeviceBridge } from "@features/platform-key-ring/v1";
 *
 * const deviceBridge = createKeyRingV1DeviceBridge({
 *   withDevice,
 *   createSessionTransport: ({ dmk, sessionId }) => new DmkCompatTransport(dmk, sessionId),
 * });
 * ```
 */
export function createKeyRingV1DeviceBridge(
  bridge: KeyRingV1DeviceBridgeInput,
): KeyRingDeviceBridge {
  return toDeviceBridge(bridge);
}

/** What `createKeyRingV1DeviceBridge` takes: the v1 device access and the DMK session transport. */
export type KeyRingV1DeviceBridgeInput = V1DeviceBridge;
