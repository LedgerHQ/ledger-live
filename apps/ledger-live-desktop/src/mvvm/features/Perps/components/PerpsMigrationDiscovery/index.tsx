import React, { useEffect } from "react";
import { cancelMigrationRequest } from "@ledgerhq/live-common/wallet-api/Perps/migrationRequest";
import ModularDrawerAddAccountFlowManager, {
  type ModularDrawerAddAccountFlowManagerProps,
} from "LLD/features/AddAccountDrawer/ModularDrawerAddAccountFlowManager";

type Props = ModularDrawerAddAccountFlowManagerProps & {
  requestId: string | null;
};

/**
 * The add account flow, bound to a migration request. Some steps close the drawer themselves,
 * so the request is cancelled when the flow goes away, which is a no-op once it has settled.
 */
export function PerpsMigrationDiscovery({ requestId, ...props }: Readonly<Props>) {
  useEffect(() => () => cancelMigrationRequest(requestId), [requestId]);

  return <ModularDrawerAddAccountFlowManager {...props} />;
}
