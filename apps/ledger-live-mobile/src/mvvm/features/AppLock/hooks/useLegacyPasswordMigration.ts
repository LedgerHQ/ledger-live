import {
  APP_LOCK_SALT_LENGTH,
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

  useEffect(() => {
    // After the legacy unlock, not at boot: that is the one moment the password has been proven and
    // is in hand. The plaintext window closes for good once the legacy entry is deleted.
    if (scheme !== "revamped" || !hasLegacyPassword || isLegacyLocked || hasRun.current) {
      return;
    }

    hasRun.current = true;

    getRandomBytesAsync(APP_LOCK_SALT_LENGTH)
      .then(salt => migrateLegacyPassword(salt, Platform.OS))
      .then(result => {
        // Only a completed migration retires the legacy lock. A deferred one leaves both in place,
        // which is the safe half: the user still gets in through the entry it did not delete.
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
