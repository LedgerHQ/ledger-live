import React from "react";
import ModularDrawerAddAccountFlowManager, {
  type ModularDrawerAddAccountFlowManagerProps,
} from "LLD/features/AddAccountDrawer/ModularDrawerAddAccountFlowManager";
import { usePerpsMigrationDiscoveryViewModel } from "./usePerpsMigrationDiscoveryViewModel";

type Props = ModularDrawerAddAccountFlowManagerProps & {
  requestId: string | null;
};

/** The add account flow, bound to a migration request. */
export function PerpsMigrationDiscovery({ requestId, ...props }: Readonly<Props>) {
  usePerpsMigrationDiscoveryViewModel(requestId);

  return <ModularDrawerAddAccountFlowManager {...props} />;
}
