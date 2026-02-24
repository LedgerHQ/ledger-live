/**
 * Import account IDs from Ledger Wallet Sync (Cloud Sync): device + trustchain + pull.
 * Same idea as trustchain AppAccountsSync: get trustchain from device, then CloudSync pull to get accounts list.
 *
 * Member credentials are never persisted (no sessionStorage). We always obtain fresh credentials
 * via the device per import to avoid storing sensitive data in clear text.
 */
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol";
import type { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { CloudSyncSDK } from "@ledgerhq/live-wallet/cloudsync/index";
import walletsync, { liveSlug } from "@ledgerhq/live-wallet/walletsync/index";
import type { DistantState } from "@ledgerhq/live-wallet/walletsync/index";
import getEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";

/**
 * Import account IDs from Wallet Sync (Cloud Sync). Connects to device, gets or creates trustchain,
 * pulls cloud data and returns the list of account IDs stored in the cloud.
 * Obtains fresh member credentials from the device each time (never stored).
 */
export async function importAccountIdsFromWalletSync(deviceId: string): Promise<string[]> {
  const { cloudSyncApiBaseUrl, trustchainApiBaseUrl } = getEnvironmentParams("STAGING");

  const context = {
    applicationId: 16,
    name: "WebTools",
    apiBaseUrl: trustchainApiBaseUrl,
  };

  const trustchainSdk = getSdk(false, context, withDevice);

  const memberCredentials: MemberCredentials = await trustchainSdk.initMemberCredentials();

  const result = await trustchainSdk.getOrCreateTrustchain(deviceId, memberCredentials);
  const trustchain: Trustchain = result.trustchain;

  let capturedIds: string[] = [];
  const walletSyncSdk = new CloudSyncSDK({
    apiBaseUrl: cloudSyncApiBaseUrl,
    slug: liveSlug,
    schema: walletsync.schema,
    trustchainSdk,
    getCurrentVersion: () => undefined,
    saveNewUpdate: async event => {
      if (event.type === "new-data" && event.data) {
        const data = event.data as DistantState;
        if (Array.isArray(data?.accounts)) {
          capturedIds = data.accounts.map((a: { id: string }) => a.id);
        }
      } else if (event.type === "deleted-data") {
        capturedIds = [];
      }
    },
  });

  await walletSyncSdk.pull(trustchain, memberCredentials);
  return capturedIds;
}
