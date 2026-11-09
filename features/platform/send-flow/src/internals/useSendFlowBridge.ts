import { use } from "react";
import { useSendFlowPorts } from "../ports/SendFlowPortsContext";
import type { SendAccount, SendAccountBridge, SendAccountLike } from "../registry";

// Requires a <Suspense> boundary in the parent tree.
export function useAccountBridge(
  account: SendAccountLike,
  parentAccount?: SendAccount | null,
): SendAccountBridge {
  return use(useSendFlowPorts().getAccountBridge(account, parentAccount));
}

export function useSendFeatures() {
  return useSendFlowPorts().sendFeatures;
}
