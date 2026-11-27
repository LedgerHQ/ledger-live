import type {
  MemberCredentials,
  Trustchain,
  TrustchainSDK,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import type { KeyRingStream, KeyRingStreamRef } from "../../types";
import { withKeyRingErrors } from "./withKeyRingErrors";

/** The public reference of a v1 trustchain's application stream. */
export function streamRefOf(trustchain: Trustchain): KeyRingStreamRef {
  return { treeId: trustchain.rootId, streamPath: trustchain.applicationPath };
}

/** A `KeyRingStream` on the v1 SDK, bound to `trustchain` as it is now. */
export function v1Stream(
  sdk: TrustchainSDK,
  trustchain: Trustchain,
  memberCredentials: MemberCredentials,
): KeyRingStream {
  return {
    ref: streamRefOf(trustchain),
    withAuth(job, policy) {
      return withKeyRingErrors(() => sdk.withAuth(trustchain, memberCredentials, job, policy));
    },
    encrypt(data) {
      return withKeyRingErrors(() => sdk.encryptUserData(trustchain, data));
    },
    decrypt(data) {
      return withKeyRingErrors(() => sdk.decryptUserData(trustchain, data));
    },
  };
}
