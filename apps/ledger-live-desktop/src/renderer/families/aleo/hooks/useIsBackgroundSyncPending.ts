import { useEffect, useState } from "react";
import { isBackgroundSyncPending$ } from "@ledgerhq/live-common/families/aleo/sync";

export function useIsBackgroundSyncPending(): boolean {
  const [isPending, setIsPending] = useState(() => isBackgroundSyncPending$.getValue());

  useEffect(() => {
    const sub = isBackgroundSyncPending$.subscribe(setIsPending);
    return () => sub.unsubscribe();
  }, []);

  return isPending;
}
