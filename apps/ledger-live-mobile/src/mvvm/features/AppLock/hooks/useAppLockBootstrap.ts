import {
  isProtectionStale,
  resetAppLock,
  setBiometricsEnabled,
  setHasPassword,
  setNeedsLongerPassword,
} from "@features/platform-app-lock";
import { useEffect, useState } from "react";
import { useDispatch } from "~/context/hooks";
import { disarmBiometricPrompt, hasArmedBiometricPrompt } from "../adapters/biometrics";
import { hasInstallMarker } from "../adapters/installMarker";
import {
  clearPasswordVerifier,
  hasPasswordVerifier,
  readStoredPassword,
} from "../adapters/verifierStore";

export function useAppLockBootstrap(): boolean {
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      readStoredPassword(),
      hasPasswordVerifier(),
      hasArmedBiometricPrompt(),
      hasInstallMarker(),
    ])
      .then(async ([stored, hasVerifier, hasBiometrics, marker]) => {
        const stale = isProtectionStale({
          hasStoredProtection: hasVerifier || hasBiometrics,
          hasInstallMarker: marker,
        });

        if (stale) {
          // Both, not just the verifier: an armed prompt would keep locking an app with nothing in it.
          await Promise.all([clearPasswordVerifier(), disarmBiometricPrompt()]);

          if (!cancelled) {
            dispatch(resetAppLock());
            setIsReady(true);
          }

          return;
        }

        if (!cancelled) {
          // A verifier that will not parse still counts: refusing entry beats dropping the lock.
          dispatch(setHasPassword(hasVerifier));
          dispatch(setNeedsLongerPassword(stored?.needsLongerPassword ?? false));
          dispatch(setBiometricsEnabled(hasBiometrics));
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
