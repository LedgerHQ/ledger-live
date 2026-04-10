import { useEffect, useState } from "react";
import { isPrivateSyncPending$ } from "@ledgerhq/live-common/families/aleo/sync";

export function useIsPrivateSyncPending(): boolean {
  const [isPending, setIsPending] = useState(() => isPrivateSyncPending$.getValue());

  useEffect(() => {
    const sub = isPrivateSyncPending$.subscribe(setIsPending);
    return () => sub.unsubscribe();
  }, []);

  return isPending;
}
