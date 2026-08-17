import { setHasPassword } from "@features/platform-app-lock";
import { useEffect, useState } from "react";
import { useDispatch } from "~/context/hooks";
import { hasPasswordVerifier } from "../adapters/verifierStore";

export function useAppLockHydration(): boolean {
  const dispatch = useDispatch();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    hasPasswordVerifier()
      .then(exists => {
        if (cancelled) {
          return;
        }

        dispatch(setHasPassword(exists));
        setIsHydrated(true);
      })
      .catch(() => {
        if (!cancelled) {
          dispatch(setHasPassword(true));
          setIsHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return isHydrated;
}
