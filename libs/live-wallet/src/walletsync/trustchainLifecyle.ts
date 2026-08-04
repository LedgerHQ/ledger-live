import type { TrustchainLifecycle } from "@ledgerhq/ledger-key-ring-protocol/types";
import { trustchainLifecycle as platformTrustchainLifecycle } from "@features/platform-wallet-sync";
import type { WSState } from "../store";

export { liveSlug } from "@features/platform-wallet-sync";

/**
 * implements to provide to TrustchainSdk the glue with cloudsync/walletsync.
 * Deprecated: this only pins the lkrp-typed signature over
 * @features/platform-wallet-sync, which holds the implementation.
 */
export function trustchainLifecycle(opts: {
  cloudSyncApiBaseUrl: string;
  getCurrentWSState: () => WSState;
}): TrustchainLifecycle {
  return platformTrustchainLifecycle(opts);
}
