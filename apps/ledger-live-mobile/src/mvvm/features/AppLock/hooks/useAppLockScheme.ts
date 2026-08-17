import { resolveAppLockScheme, type AppLockScheme } from "@features/platform-app-lock";
import { useFeature } from "@features/platform-feature-flags";
import { useEffect, useState } from "react";
import { hasPasswordVerifier } from "../adapters/verifierStore";

export function useAppLockScheme(): AppLockScheme | undefined {
  const isRevampEnabled = useFeature("lwmPasswordRevamp")?.enabled ?? false;
  const [hasStoredVerifier, setHasStoredVerifier] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    hasPasswordVerifier()
      .then(exists => {
        if (!cancelled) {
          setHasStoredVerifier(exists);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasStoredVerifier(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return hasStoredVerifier === undefined
    ? undefined
    : resolveAppLockScheme({ hasStoredVerifier, isRevampEnabled });
}
