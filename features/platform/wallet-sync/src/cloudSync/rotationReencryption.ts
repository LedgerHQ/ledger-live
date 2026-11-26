import type {
  KeyRingClient,
  KeyRingRotationHandler,
  KeyRingStream,
} from "@features/platform-key-ring";
import { keyRingTrustSdk, locatorOf } from "../internals/cloudSyncLocator";
import { reencryptOnRotation, type RotationSide } from "../internals/rotationReencryption";

/**
 * Registers `createRotationReencryption` on the lifecycle of `client`, so a key rotation moves the
 * Cloud Sync data to the new key. Call it once, when the app builds its key ring client (desktop
 * only today). Returns the unregistration.
 *
 * @example
 * ```ts
 * const keyRing = createKeyRingClient({
 *   mock: isMockEnv,
 *   instanceName,
 *   apiBaseUrl: trustchainApiBaseUrl,
 *   deviceBridge,
 *   runtime,
 * });
 * registerRotationReencryption(keyRing, { cloudSyncApiBaseUrl, getCurrentWSState });
 * ```
 */
export function registerRotationReencryption(
  client: KeyRingClient,
  config: RotationReencryptionConfig,
): () => void {
  return client.lifecycle.onKeyRotation(createRotationReencryption(config));
}

/**
 * Moves the Cloud Sync data to the new key when the key tree rotates: deletes it under the old
 * stream with a token taken before the rotation, then uploads the current state under the new
 * one. Uploads nothing when there is no saved document. Apps register it with
 * `registerRotationReencryption`.
 *
 * @example
 * ```ts
 * keyRing.lifecycle.onKeyRotation(
 *   createRotationReencryption({ cloudSyncApiBaseUrl, getCurrentWSState }),
 * );
 * ```
 */
export function createRotationReencryption({
  cloudSyncApiBaseUrl,
  getCurrentWSState,
}: RotationReencryptionConfig): KeyRingRotationHandler {
  const beforeRotation = reencryptOnRotation({ cloudSyncApiBaseUrl, getCurrentWSState });
  return async function onKeyRotation(previous) {
    const afterRotation = await beforeRotation(streamSide(previous));
    return next => afterRotation(streamSide(next));
  };
}

/** What the rotation re-encryption reads from the app. */
export type RotationReencryptionConfig = Readonly<{
  /** Base URL of the Cloud Sync API, from the app's environment parameters. */
  cloudSyncApiBaseUrl: string;
  /** The saved Ledger Wallet document and its version, read when the rotation completes. */
  getCurrentWSState: () => { data: unknown; version: number };
}>;

// The key never reaches this package: the locator is addressed by id, the stream encrypts.
function streamSide(stream: KeyRingStream): RotationSide {
  return {
    refreshToken() {
      return stream.withAuth(jwt => Promise.resolve(jwt), "refresh");
    },
    locator: locatorOf(stream),
    cipherSdk: keyRingTrustSdk,
  };
}
