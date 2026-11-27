import type { MemberCredentials, Trustchain, TrustchainSDK } from "@shared/cloud-sync";
import type { KeyRingStream } from "@features/platform-key-ring";

const NO_KEY = "";

/**
 * Empty member credentials for the v1-shaped arguments of `@shared/cloud-sync`. It hands them to
 * `keyRingTrustSdk`, which ignores them: the key never reaches this package.
 */
export const NO_MEMBER_CREDENTIALS: MemberCredentials = { pubkey: NO_KEY, privatekey: NO_KEY };

/** The trust SDK `@shared/cloud-sync` calls back: answers from the stream behind each locator. */
export const keyRingTrustSdk: TrustchainSDK = {
  withAuth(locator, _memberCredentials, job, policy) {
    return streamOf(locator).withAuth(job, policy);
  },
  encryptUserData(locator, data) {
    return streamOf(locator).encrypt(data);
  },
  decryptUserData(locator, data) {
    return streamOf(locator).decrypt(data);
  },
};

/**
 * A trustchain-shaped locator for `@shared/cloud-sync`, which reads only its id and path. The
 * encryption key stays empty; `keyRingTrustSdk` finds the stream back from the object identity.
 */
export function locatorOf(stream: KeyRingStream): Trustchain {
  const locator: Trustchain = {
    rootId: stream.ref.treeId,
    applicationPath: stream.ref.streamPath,
    walletSyncEncryptionKey: NO_KEY,
  };
  streams.set(locator, stream);
  return locator;
}

const streams = new WeakMap<Trustchain, KeyRingStream>();

function streamOf(locator: Trustchain): KeyRingStream {
  const stream = streams.get(locator);
  if (!stream) throw new Error("Cloud Sync called with an unknown key ring stream");
  return stream;
}
