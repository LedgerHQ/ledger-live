import { TrustchainLifecycle } from "@ledgerhq/trustchain/types";
import api from "../cloudsync/api";
import { liveSlug } from ".";
import { WSState } from "../store";
import { makeCipher } from "../cloudsync/cipher";

/**
 * implements to provide to TrustchainSdk the glue with cloudsync/walletsync
 */
export function trustchainLifecycle({
  getCurrentWSState,
}: {
  getCurrentWSState: () => WSState;
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
        // when trustchain rotates, we need to delete old data to inform members still on the old id
        await api.deleteData(oldJwt, liveSlug, oldTrustchain.applicationPath);
        const newJwt = await trustchainSdk.withAuth(
          newTrustchain,
          memberCredentials,
          jwt => Promise.resolve(jwt),
          "refresh",
        );
        // we then need to push back data to a new CloudSync id with the new encryption key
        const { version, data } = getCurrentWSState();
        if (!data) return;
        const cipher = makeCipher(trustchainSdk);
        const payload = await cipher.encrypt(newTrustchain, data);
        await api.uploadData(newJwt, liveSlug, version, payload, newTrustchain.applicationPath);
      };
    },
  };
}
