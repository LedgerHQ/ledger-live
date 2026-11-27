import {
  APP_LOCK_SALT_LENGTH,
  isLegacyMigrationComplete,
  migrateLegacyPassword,
  setBiometricsEnabled,
  setHasPassword,
  setNeedsLongerPassword,
  storeBiometricsMarker,
} from "@features/platform-app-lock";
import { track } from "@shared/analytics";
import { getRandomBytesAsync } from "expo-crypto";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { disablePrivacy } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { isLockedSelector } from "~/reducers/auth";
import { privacySelector } from "~/reducers/settings";
import { useAppLockScheme } from "./useAppLockScheme";

// Carried over, or the next unlock asks for a password someone who always used biometrics may have
// forgotten. A marker that will not store leaves the password, which still opens the app.
async function carryLegacyBiometrics(): Promise<boolean> {
  try {
    return await storeBiometricsMarker();
  } catch {
    return false;
  }
}

export function useLegacyPasswordMigration(): void {
  const dispatch = useDispatch();
  const scheme = useAppLockScheme();
  const legacyPrivacy = useSelector(privacySelector);
  const isLegacyLocked = useSelector(isLockedSelector);
  const hasRun = useRef(false);

  const hasLegacyPassword = Boolean(legacyPrivacy?.hasPassword);
  const hasLegacyBiometrics = Boolean(legacyPrivacy?.biometricsEnabled);

  // A run that deleted the entry but died before the dispatch below leaves this flag demanding a
  // password nothing can check, and the guard in the next effect would never let it run again.
  useEffect(() => {
    if (scheme !== "revamped" || !hasLegacyPassword) {
      return;
    }

    let cancelled = false;

    isLegacyMigrationComplete()
      .catch(() => false)
      .then(async isComplete => {
        if (!isComplete || cancelled) {
          return;
        }

        const hasBiometrics = hasLegacyBiometrics && (await carryLegacyBiometrics());

        if (cancelled) {
          return;
        }

        if (hasBiometrics) {
          dispatch(setBiometricsEnabled(true));
        }
        dispatch(disablePrivacy());
        dispatch(setHasPassword(true));
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, hasLegacyBiometrics, hasLegacyPassword, scheme]);

  // After the legacy unlock, not at boot: that is the one moment the password is in hand.
  useEffect(() => {
    if (scheme !== "revamped" || !hasLegacyPassword || isLegacyLocked || hasRun.current) {
      return;
    }

    hasRun.current = true;

    getRandomBytesAsync(APP_LOCK_SALT_LENGTH)
      .then(salt => migrateLegacyPassword(salt, Platform.OS))
      .then(async result => {
        if (result.status !== "migrated") {
          hasRun.current = false;
          return;
        }

        const hasBiometrics = hasLegacyBiometrics && (await carryLegacyBiometrics());

        if (hasBiometrics) {
          dispatch(setBiometricsEnabled(true));
        }
        dispatch(disablePrivacy());
        dispatch(setHasPassword(true));
        dispatch(setNeedsLongerPassword(result.needsLongerPassword));
        track("encryption_updated", {
          status: "migrated",
          type: "password",
          source: "migration",
        });
      })
      .catch(() => {
        hasRun.current = false;
      });
  }, [dispatch, hasLegacyBiometrics, hasLegacyPassword, isLegacyLocked, scheme]);
}
