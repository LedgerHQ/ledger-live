import type { KeyRingClient, KeyRingDeviceBridge } from "../types";
import { createLifecycleHub } from "../internals/lifecycleHub";
import { createV1Client, v1SdkFactory } from "../internals/v1/client";
import { v1BridgeOf } from "../internals/v1/deviceBridge";

/**
 * The key ring client of this app: one per app session, built at the composition root. Every
 * feature reads this one instance; a DIE run binds it to its device session with
 * `forDeviceSession`.
 *
 * @example
 * ```ts
 * const client = createKeyRingClient({
 *   mock: isMockEnv,
 *   instanceName,
 *   apiBaseUrl: trustchainApiBaseUrl,
 *   deviceBridge: createKeyRingV1DeviceBridge({
 *     withDevice,
 *     createSessionTransport: ({ dmk, sessionId }) => new DmkCompatTransport(dmk, sessionId),
 *   }),
 * });
 * ```
 */
export function createKeyRingClient(config: KeyRingClientConfig): KeyRingClient {
  const hub = createLifecycleHub();
  return createV1Client({
    apiBaseUrl: config.apiBaseUrl,
    bridge: v1BridgeOf(config.deviceBridge),
    hub,
    createSdk: v1SdkFactory({
      mock: config.mock,
      instanceName: config.instanceName,
      apiBaseUrl: config.apiBaseUrl,
      hub,
    }),
  });
}

/** The setup of `createKeyRingClient`, fixed for the app session. */
export type KeyRingClientConfig = Readonly<{
  /** The e2e mock environment: no backend, no device. */
  mock: boolean;
  /** How the other instances see this one in the members list. */
  instanceName: string;
  /** The key ring backend. */
  apiBaseUrl: string;
  /** How the protocol adapter reaches devices. */
  deviceBridge: KeyRingDeviceBridge;
}>;
