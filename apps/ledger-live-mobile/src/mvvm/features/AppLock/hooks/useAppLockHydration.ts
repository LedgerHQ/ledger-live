import { hasPasswordVerifier, hydrateAppLock } from "@features/platform-app-lock";
import { useEffect } from "react";
import { useDispatch } from "~/context/hooks";

// Mounted once, by the provider. A failed read counts as protected.
export function useAppLockHydration(): void {
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    hasPasswordVerifier()
      .then(exists => {
        if (!cancelled) {
          dispatch(hydrateAppLock(exists));
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch(hydrateAppLock(true));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);
}
