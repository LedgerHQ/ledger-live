import { useEffect } from "react";
import { useBridgeSync } from "./context";
export const SyncOneAccountOnMount = ({
  priority,
  accountId,
  reason = "one-account",
}: {
  accountId: string;
  priority: number;
  reason?: string;
}): null => {
  const sync = useBridgeSync();
  useEffect(() => {
    sync({
      type: "SYNC_ONE_ACCOUNT",
      priority,
      accountId,
      reason,
    });
  }, [sync, priority, accountId, reason]);
  return null;
};
