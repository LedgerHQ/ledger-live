import { useEffect, useState } from "react";
import { isCombinedSyncPending$ } from "@ledgerhq/live-common/families/aleo/sync";

export function useIsCombinedSyncPending(): boolean {
  const [isPending, setIsPending] = useState(() => isCombinedSyncPending$.getValue());

  useEffect(() => {
    const sub = isCombinedSyncPending$.subscribe(setIsPending);
    return () => sub.unsubscribe();
  }, []);

  return isPending;
}
