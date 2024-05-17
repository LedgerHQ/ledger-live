import { useCallback, useEffect, useState } from "react";
import getUser from "~/helpers/user";
import { getStoreValue } from "~/renderer/store";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { saveSettings } from "~/renderer/actions/settings";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { isLocked as isLockedSelector } from "~/renderer/reducers/application";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";

const ONBOARDED_VIA_RECOVER_RESTORE_USER_PREFIX = "ONBOARDED_VIA_RECOVER_RESTORE_USER_";

export const useRecoverRestoreOnboarding = (seedPathStatus?: string) => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const isLocked = useSelector(isLockedSelector);
  const recoverServices = useFeature("protectServicesDesktop");
  const recoverStoreId = recoverServices?.params?.protectId ?? "";
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const [onboardedViaRecoverRestore, setOnboardedViaRecoverRestore] = useState<boolean>();

  const confirmRecoverOnboardingStatus = useCallback(async () => {
    const { id } = await getUser();
    const status = getStoreValue(
      `${ONBOARDED_VIA_RECOVER_RESTORE_USER_PREFIX}${id}`,
      recoverStoreId,
    );
    const hasCompletedOnboardingViaRestore = status === "true";

    setOnboardedViaRecoverRestore(hasCompletedOnboardingViaRestore);
    if (!isLocked) {
      dispatch(
        saveSettings({
          hasCompletedOnboarding: onboardedViaRecoverRestore,
        }),
      );
    }
  }, [dispatch, isLocked, onboardedViaRecoverRestore, recoverStoreId]);

  useEffect(() => {
    const userIsOnboardingOrSettingUp =
      pathname.includes("onboarding") || pathname.includes("settings");

    const syncOnboardingFromRestoreStax = seedPathStatus === "recover_seed";

    if (
      (!userIsOnboardingOrSettingUp || syncOnboardingFromRestoreStax) &&
      !hasCompletedOnboarding
    ) {
      confirmRecoverOnboardingStatus();
    }
  });

  return {
    confirmRecoverOnboardingStatus,
  };
};
