import {
  APP_LOCK_SALT_LENGTH,
  isLegacyMigrationComplete,
  migrateLegacyPassword,
  setHasPassword,
  setNeedsLongerPassword,
} from "@features/platform-app-lock";
import { getRandomBytesAsync } from "expo-crypto";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { disablePrivacy } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { isLockedSelector } from "~/reducers/auth";
import { privacySelector } from "~/reducers/settings";
import { useAppLockScheme } from "./useAppLockScheme";

export function useLegacyPasswordMigration(): void {
  const dispatch = useDispatch();
  const scheme = useAppLockScheme();
  const legacyPrivacy = useSelector(privacySelector);
  const isLegacyLocked = useSelector(isLockedSelector);
  const hasRun = useRef(false);

  const hasLegacyPassword = Boolean(legacyPrivacy?.hasPassword);

  // A run that deleted the entry but died before the dispatch below leaves this flag demanding a
  // password nothing can check, and the guard in the next effect would never let it run again.
  useEffect(() => {
    if (scheme !== "revamped" || !hasLegacyPassword) {
      return;
    }

    let cancelled = false;

    isLegacyMigrationComplete()
      .catch(() => false)
      .then(isComplete => {
        if (isComplete && !cancelled) {
          dispatch(disablePrivacy());
          dispatch(setHasPassword(true));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, hasLegacyPassword, scheme]);

  // After the legacy unlock, not at boot: that is the one moment the password is in hand.
  useEffect(() => {
    if (scheme !== "revamped" || !hasLegacyPassword || isLegacyLocked || hasRun.current) {
      return;
    }

    hasRun.current = true;

    getRandomBytesAsync(APP_LOCK_SALT_LENGTH)
      .then(salt => migrateLegacyPassword(salt, Platform.OS))
      .then(result => {
        if (result.status !== "migrated") {
          hasRun.current = false;
          return;
        }

        dispatch(disablePrivacy());
        dispatch(setHasPassword(true));
        dispatch(setNeedsLongerPassword(result.needsLongerPassword));
      })
      .catch(() => {
        hasRun.current = false;
      });
  }, [dispatch, hasLegacyPassword, isLegacyLocked, scheme]);
}
