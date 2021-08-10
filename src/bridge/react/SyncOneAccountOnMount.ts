import { useEffect } from "react";
import { useBridgeSync } from "./context";
export const SyncOneAccountOnMount = ({
  priority,
  accountId,
}: {
  accountId: string;
  priority: number;
}): null => {
  const sync = useBridgeSync();
  useEffect(() => {
    sync({
      type: "SYNC_ONE_ACCOUNT",
      priority,
      accountId,
    });
  }, [sync, priority, accountId]);
  return null;
};
