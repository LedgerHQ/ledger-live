import { TrustchainLifecycle, getCloudSyncApi, makeCipher } from "@shared/cloud-sync";

export const liveSlug = "live";

export function trustchainLifecycle({
  cloudSyncApiBaseUrl,
  getCurrentWSState,
}: {
  cloudSyncApiBaseUrl: string;
  getCurrentWSState: () => { data: unknown; version: number };
}): TrustchainLifecycle {
  return {
    onTrustchainRotation: async (trustchainSdk, oldTrustchain, memberCredentials) => {
      const oldJwt = await trustchainSdk.withAuth(
        oldTrustchain,
        memberCredentials,
        jwt => Promise.resolve(jwt),
        "refresh",
      );
      return async newTrustchain => {
        const api = getCloudSyncApi(cloudSyncApiBaseUrl);
        await api.deleteData(oldJwt, liveSlug, oldTrustchain);
        const newJwt = await trustchainSdk.withAuth(
          newTrustchain,
          memberCredentials,
          jwt => Promise.resolve(jwt),
          "refresh",
        );
        const { version, data } = getCurrentWSState();
        if (!data) return;
        const cipher = makeCipher(trustchainSdk);
        const payload = await cipher.encrypt(newTrustchain, data);
        await api.uploadData(newJwt, liveSlug, version, payload, newTrustchain);
      };
    },
  };
}
