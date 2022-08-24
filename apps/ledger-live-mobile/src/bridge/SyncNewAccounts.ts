import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { accountsSelector } from "../reducers/accounts";

export default function SyncNewAccounts({ priority }: { priority: number }) {
  const ids = useSelector(accountsSelector).map(a => a.id);
  const ref = useRef(ids);
  const sync = useBridgeSync();
  useEffect(() => {
    const accountIds = ids.filter(a => !ref.current.includes(a));

    if (accountIds.length > 0) {
      ref.current = ids;
      sync({
        type: "SYNC_SOME_ACCOUNTS",
        accountIds,
        priority,
        reason: "new-accounts",
      });
    }
  }, [ids, sync, priority]);
  return null;
}
