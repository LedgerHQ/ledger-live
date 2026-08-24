import { setHasPassword, setNeedsLongerPassword } from "@features/platform-app-lock";
import { useFeature } from "@features/platform-feature-flags";
import { useEffect, useRef } from "react";
import { disablePrivacy } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { isLockedSelector } from "~/reducers/auth";
import { privacySelector } from "~/reducers/settings";
import { migrateLegacyPassword } from "../adapters/migration";

export function useLegacyPasswordMigration(): void {
  const dispatch = useDispatch();
  const isRevampEnabled = useFeature("lwmPasswordRevamp")?.enabled ?? false;
  const legacyPrivacy = useSelector(privacySelector);
  const isLegacyLocked = useSelector(isLockedSelector);
  const hasRun = useRef(false);

  const hasLegacyPassword = Boolean(legacyPrivacy?.hasPassword);

  useEffect(() => {
    if (!isRevampEnabled || !hasLegacyPassword || isLegacyLocked || hasRun.current) {
      return;
    }

    hasRun.current = true;

    migrateLegacyPassword()
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
  }, [dispatch, hasLegacyPassword, isLegacyLocked, isRevampEnabled]);
}
