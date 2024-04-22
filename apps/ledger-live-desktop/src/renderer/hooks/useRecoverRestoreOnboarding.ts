import { useCallback, useEffect, useState } from "react";
import getUser from "~/helpers/user";
import { getStoreValue } from "~/renderer/store";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { saveSettings } from "~/renderer/actions/settings";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import { useCustomPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";

const ONBOARDED_VIA_RECOVER_RESTORE_USER_PREFIX = "ONBOARDED_VIA_RECOVER_RESTORE_USER_";

export const useRecoverRestoreOnboarding = (seedPathStatus?: string) => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const recoverServices = useFeature("protectServicesDesktop");
  const recoverStoreId = recoverServices?.params?.protectId ?? "";
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const recoverRestoreStaxPath = useCustomPath(recoverServices, "restore", "lld-onboarding-24");

  const [onboardedViaRecoverRestore, setOnboardedViaRecoverRestore] = useState<boolean>();

  const confirmRecoverOnboardingStatus = useCallback(async () => {
    const { id } = await getUser();
    const status = getStoreValue(
      `${ONBOARDED_VIA_RECOVER_RESTORE_USER_PREFIX}${id}`,
      recoverStoreId,
    );
    const hasCompletedOnboardingViaRestore = status === "true";

    setOnboardedViaRecoverRestore(hasCompletedOnboardingViaRestore);

    dispatch(
      saveSettings({
        hasCompletedOnboarding: onboardedViaRecoverRestore,
      }),
    );
  }, [dispatch, onboardedViaRecoverRestore, recoverStoreId]);

  useEffect(() => {
    const userIsOnboardingOrSettingUp =
      pathname.includes("onboarding") || pathname.includes("settings");

    const syncOnboardingFromRestoreStax =
      seedPathStatus === "recover_seed" && recoverRestoreStaxPath;

    // Temp hardcode success recover onboarding due to local mismatch on userId.
    if (syncOnboardingFromRestoreStax) {
      setOnboardedViaRecoverRestore(true);

      dispatch(
          saveSettings({
            hasCompletedOnboarding: true,
          }),
      );
    }

    if (
      (!userIsOnboardingOrSettingUp /*|| syncOnboardingFromRestoreStax*/) &&
      !hasCompletedOnboarding
    ) {
      confirmRecoverOnboardingStatus();
    }
  });

  return {
    confirmRecoverOnboardingStatus,
  };
};
