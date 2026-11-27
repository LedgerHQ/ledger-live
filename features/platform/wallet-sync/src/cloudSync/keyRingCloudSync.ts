import type { Observable } from "rxjs";
import { CloudSyncSDK, type UpdateEvent } from "@shared/cloud-sync";
import type { KeyRingStream } from "@features/platform-key-ring";
import { keyRingTrustSdk, locatorOf, NO_MEMBER_CREDENTIALS } from "../internals/cloudSyncLocator";

/**
 * Creates a Cloud Sync client that runs on key ring streams: the stream authenticates and
 * encrypts, so the client never sees a key. Apps get one through `useKeyRingCloudSync`.
 *
 * @example
 * ```ts
 * const cloudSync = createKeyRingCloudSync<DistantDocument>({
 *   apiBaseUrl: cloudSyncApiBaseUrl,
 *   slug: liveSlug,
 *   getCurrentVersion: () => latestDistantVersionSelector(store.getState()),
 *   saveNewUpdate,
 * });
 * const stream = keyRing.openStream(session);
 * if (stream) await cloudSync.pull(stream);
 * ```
 */
export function createKeyRingCloudSync<Data extends Record<string, unknown>>({
  apiBaseUrl,
  slug,
  getCurrentVersion,
  saveNewUpdate,
}: KeyRingCloudSyncParams<Data>): KeyRingCloudSync<Data> {
  const sdk = new CloudSyncSDK<Data>({
    apiBaseUrl,
    slug,
    trustchainSdk: keyRingTrustSdk,
    getCurrentVersion,
    saveNewUpdate,
  });
  const keyRingCloudSync = new KeyRingCloudSyncImpl(sdk);
  return keyRingCloudSync;
}

/**
 * Cloud Sync on the stream of a key tree: the key ring authenticates and encrypts. Each call
 * takes the stream from `KeyRingClient.openStream`; key ring errors reach the caller unchanged,
 * for `classifyKeyRingError`.
 */
export interface KeyRingCloudSync<Data> {
  /** Uploads the document as the next version and saves it. No-op when the server is ahead. */
  push(stream: KeyRingStream, data: Data): Promise<void>;
  /** Saves the newer document, if any. Throws `TrustchainOutdated` if the server has none left. */
  pull(stream: KeyRingStream): Promise<void>;
  /** Deletes the document on the server, then saves the deletion. */
  destroy(stream: KeyRingStream): Promise<void>;
  /** Emits on each update the server notifies for the document. */
  listenNotifications(stream: KeyRingStream): Observable<number>;
}

/** Options of `createKeyRingCloudSync`. */
export type KeyRingCloudSyncParams<Data> = Readonly<{
  /** Base URL of the Cloud Sync API, from the app's environment parameters. */
  apiBaseUrl: string;
  /** Name of the synced document. The Ledger Wallet document is `liveSlug`. */
  slug: string;
  /** Version of the last saved document, or undefined before the first pull. */
  getCurrentVersion: () => number | undefined;
  /** Saves each update event, usually built with `makeSaveNewUpdate`. */
  saveNewUpdate: (event: UpdateEvent<Data>) => Promise<void>;
}>;

/** Adapts the trustchain-shaped `CloudSyncSDK` to key ring streams. */
class KeyRingCloudSyncImpl<Data extends Record<string, unknown>> implements KeyRingCloudSync<Data> {
  readonly #sdk: CloudSyncSDK<Data>;
  constructor(sdk: CloudSyncSDK<Data>) {
    this.#sdk = sdk;
  }
  async push(stream: KeyRingStream, data: Data): Promise<void> {
    await this.#sdk.push(locatorOf(stream), NO_MEMBER_CREDENTIALS, data);
  }
  async pull(stream: KeyRingStream) {
    await this.#sdk.pull(locatorOf(stream), NO_MEMBER_CREDENTIALS);
  }
  async destroy(stream: KeyRingStream) {
    await this.#sdk.destroy(locatorOf(stream), NO_MEMBER_CREDENTIALS);
  }
  listenNotifications(stream: KeyRingStream) {
    return this.#sdk.listenNotifications(locatorOf(stream), NO_MEMBER_CREDENTIALS);
  }
}
