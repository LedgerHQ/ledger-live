import { setHasPassword, setNeedsLongerPassword } from "@features/platform-app-lock";
import { useEffect, useState } from "react";
import { useDispatch } from "~/context/hooks";
import { readStoredPassword } from "../adapters/verifierStore";

export function useAppLockBootstrap(): boolean {
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    readStoredPassword()
      .then(stored => {
        if (!cancelled) {
          dispatch(setHasPassword(stored !== null));
          dispatch(setNeedsLongerPassword(stored?.needsLongerPassword ?? false));
          setIsReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch(setHasPassword(true));
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return isReady;
}
