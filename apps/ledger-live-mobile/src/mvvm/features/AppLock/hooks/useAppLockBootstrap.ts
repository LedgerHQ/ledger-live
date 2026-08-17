import { setHasPassword } from "@features/platform-app-lock";
import { useEffect, useState } from "react";
import { useDispatch } from "~/context/hooks";
import { hasPasswordVerifier } from "../adapters/verifierStore";

export function useAppLockBootstrap(): boolean {
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    hasPasswordVerifier()
      .then(exists => {
        if (!cancelled) {
          dispatch(setHasPassword(exists));
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
