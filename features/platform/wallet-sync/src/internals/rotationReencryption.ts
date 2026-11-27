import {
  getCloudSyncApi,
  makeCipher,
  type JWT,
  type Trustchain,
  type TrustchainSDK,
} from "@shared/cloud-sync";
import { liveSlug } from "../cloudSync/liveSlug";

/**
 * The delete, re-encrypt and upload sequence both rotation hooks share. Takes the side before the
 * rotation, returns what to run on the side after it: the old token is taken before the key
 * rotates, the data is deleted under the old tree, then the current state is uploaded under the
 * new one when there is a saved document.
 */
export function reencryptOnRotation({
  cloudSyncApiBaseUrl,
  getCurrentWSState,
}: RotationReencryptionParams): (
  previous: RotationSide,
) => Promise<(next: RotationSide) => Promise<void>> {
  return async function beforeRotation(previous) {
    const oldJwt = await previous.refreshToken();
    return async function afterRotation(next) {
      const api = getCloudSyncApi(cloudSyncApiBaseUrl);
      await api.deleteData(oldJwt, liveSlug, previous.locator);
      const newJwt = await next.refreshToken();
      const { version, data } = getCurrentWSState();
      if (!data) return;
      const payload = await makeCipher(next.cipherSdk).encrypt(next.locator, data);
      await api.uploadData(newJwt, liveSlug, version, payload, next.locator);
    };
  };
}

/** What both rotation hooks take from the app. */
export type RotationReencryptionParams = Readonly<{
  /** Base URL of the Cloud Sync API, from the app's environment parameters. */
  cloudSyncApiBaseUrl: string;
  /** The saved Ledger Wallet document and its version, read when the rotation completes. */
  getCurrentWSState: () => { data: unknown; version: number };
}>;

/** One side of a rotation, as the Cloud Sync API and its cipher see it. */
export type RotationSide = Readonly<{
  /** A fresh token on this side's tree. */
  refreshToken(): Promise<JWT>;
  /** What the Cloud Sync API is addressed with for this side. */
  locator: Trustchain;
  /** What the cipher encrypts this side's data with. */
  cipherSdk: TrustchainSDK;
}>;
