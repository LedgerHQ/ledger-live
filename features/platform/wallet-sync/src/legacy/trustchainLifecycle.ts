import type {
  MemberCredentials,
  Trustchain,
  TrustchainLifecycle,
  TrustchainSDK,
} from "@shared/cloud-sync";
import { reencryptOnRotation, type RotationSide } from "../internals/rotationReencryption";

/**
 * Re-encrypts the Ledger Wallet document on a v1 trustchain rotation, for callers that still
 * drive the v1 trustchain SDK. Its only caller is the web-tools trustchain playground
 * (`apps/web-tools/src/trustchain/components/App.tsx`), through the `./legacy` subpath.
 *
 * @deprecated Register `createRotationReencryption` on the key ring lifecycle of
 * `@features/platform-key-ring`.
 */
export function trustchainLifecycle({
  cloudSyncApiBaseUrl,
  getCurrentWSState,
}: {
  cloudSyncApiBaseUrl: string;
  getCurrentWSState: () => { data: unknown; version: number };
}): TrustchainLifecycle {
  const beforeRotation = reencryptOnRotation({ cloudSyncApiBaseUrl, getCurrentWSState });
  return {
    async onTrustchainRotation(trustchainSdk, oldTrustchain, memberCredentials) {
      const afterRotation = await beforeRotation(
        trustchainSide(trustchainSdk, oldTrustchain, memberCredentials),
      );
      return newTrustchain =>
        afterRotation(trustchainSide(trustchainSdk, newTrustchain, memberCredentials));
    },
  };
}

// v1 callers hold the trustchain itself: it addresses the API and the SDK encrypts with it.
function trustchainSide(
  trustchainSdk: TrustchainSDK,
  trustchain: Trustchain,
  memberCredentials: MemberCredentials,
): RotationSide {
  return {
    refreshToken() {
      return trustchainSdk.withAuth(
        trustchain,
        memberCredentials,
        jwt => Promise.resolve(jwt),
        "refresh",
      );
    },
    locator: trustchain,
    cipherSdk: trustchainSdk,
  };
}
