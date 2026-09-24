import {
  clearBiometricsMarker,
  clearStoredPassword,
  hasBiometricsMarker,
  hasPasswordVerifier,
  hydrateAppLock,
  isProtectionStale,
} from "@features/platform-app-lock";
import { useEffect } from "react";
import { useDispatch } from "~/context/hooks";
import { hasKnownInstall, writeInstallMarker } from "../adapters/installMarker";

type Protection = Readonly<{ hasPassword: boolean; biometricsEnabled: boolean }>;

async function readProtection(): Promise<Protection> {
  // A read that fails counts as protected: the app would otherwise open itself on a keychain
  // error, and one unreadable protection must not hide the other.
  const [verifier, biometrics, install] = await Promise.allSettled([
    hasPasswordVerifier(),
    hasBiometricsMarker(),
    hasKnownInstall(),
  ]);

  const hasPassword = verifier.status === "fulfilled" ? verifier.value : true;
  const biometricsEnabled = biometrics.status === "fulfilled" ? biometrics.value : true;
  // Unreadable app storage counts as this install's: the opposite would delete a live protection
  // over a transient error.
  const installed = install.status === "fulfilled" ? install.value : true;

  const stale = isProtectionStale({
    hasStoredProtection: hasPassword || biometricsEnabled,
    hasKnownInstall: installed,
  });

  // Settled, not awaited: a storage that will not take the marker must not stop the app from
  // deciding whether it is locked, or the gate holds its cover with nothing coming to lift it.
  await Promise.allSettled([writeInstallMarker()]);

  if (!stale) {
    return { hasPassword, biometricsEnabled };
  }

  await Promise.allSettled([clearStoredPassword(), clearBiometricsMarker()]);

  return { hasPassword: false, biometricsEnabled: false };
}

// Mounted once, by the provider.
export function useAppLockHydration(): void {
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    readProtection()
      // The gate covers the screen until this dispatch lands, so there is no path that leaves it
      // undecided: an unexpected failure resolves to protected.
      .catch(() => ({ hasPassword: true, biometricsEnabled: true }) as Protection)
      .then(protection => {
        if (!cancelled) {
          dispatch(hydrateAppLock(protection));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);
}
