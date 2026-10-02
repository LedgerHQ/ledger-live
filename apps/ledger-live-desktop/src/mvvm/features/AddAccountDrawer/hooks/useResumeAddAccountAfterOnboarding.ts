import { useEffect } from "react";
import { useLocation } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import { addAccountResumed, addAccountToResumeSelector } from "~/renderer/reducers/onboarding";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { useShouldRedirect } from "~/renderer/hooks/useAutoRedirectToPostOnboarding/useShouldRedirect";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/analytics/originFlow";

/**
 * Resumes the Add Account flow interrupted by device onboarding, once back on the screen it
 * started from: reopens Add Account on the same asset. Mounted app-wide.
 */
export const useResumeAddAccountAfterOnboarding = (): void => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const toResume = useSelector(addAccountToResumeSelector);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { shouldRedirectToRecoverUpsell } = useShouldRedirect();
  const { openAddAccountFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "resume_add_account",
  );

  useEffect(() => {
    if (!toResume || pathname !== toResume.returnTo) return;
    if (!hasOnboardedDevice || shouldRedirectToRecoverUpsell) return;
    dispatch(addAccountResumed());
    setOriginFlow(HOOKS_TRACKING_LOCATIONS.addAccountModal);
    openAddAccountFlow(toResume.currency);
  }, [
    dispatch,
    hasOnboardedDevice,
    openAddAccountFlow,
    pathname,
    shouldRedirectToRecoverUpsell,
    toResume,
  ]);
};
