import { useEffect } from "react";
import { cancelMigrationRequest } from "@ledgerhq/live-common/wallet-api/Perps/migrationRequest";

/**
 * Some add account steps close the drawer themselves, so the migration request is cancelled
 * when the flow goes away, which is a no-op once it has settled.
 */
export function usePerpsMigrationDiscoveryViewModel(requestId: string | null) {
  useEffect(() => () => cancelMigrationRequest(requestId), [requestId]);
}
