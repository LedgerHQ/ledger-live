import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { LKRP_APPLICATION_ID, TRUSTCHAIN_API_URLS, type LedgerSyncEnvironment } from "./constants";

/** `applicationId` defaults to wallet-cli's own `ring` application (17). Ledger Sync
 * passes `LEDGER_SYNC_APPLICATION_ID` (16) instead so the two never share a trustchain application.
 * `environment` defaults to "production" — `ring` never passes it (it has no staging support), only
 * Ledger Sync does, always deriving it from the session's persisted `ledgerSyncEnvironment` rather
 * than a fresh per-call flag, so the LKRP/Trustchain backend here and the Cloud Sync backend in
 * `ledger-sync/cloud-sync-accounts.ts` can never point at different environments. */
export function createLkrpSdk(options?: {
  memberName?: string;
  applicationId?: number;
  environment?: LedgerSyncEnvironment;
}) {
  const {
    memberName = "wallet-cli",
    applicationId = LKRP_APPLICATION_ID,
    environment = "production",
  } = options ?? {};
  return getSdk(
    process.env.WALLET_CLI_MOCK === "1",
    {
      applicationId,
      name: memberName,
      apiBaseUrl: TRUSTCHAIN_API_URLS[environment],
    },
    withDevice,
  );
}
