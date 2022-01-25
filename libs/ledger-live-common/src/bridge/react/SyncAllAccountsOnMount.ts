import { useEffect } from "react";
import { useBridgeSync } from "./context";
export const SyncAllAccountsOnMount = ({
  priority,
}: {
  priority: number;
}): null => {
  const sync = useBridgeSync();
  useEffect(() => {
    sync({
      type: "SYNC_ALL_ACCOUNTS",
      priority,
    });
  }, [sync, priority]);
  return null;
};
