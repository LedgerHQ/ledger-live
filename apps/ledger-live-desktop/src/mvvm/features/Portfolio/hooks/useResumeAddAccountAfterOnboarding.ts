import { useEffect } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import {
  setShouldResumeAddAccountAfterOnboarding,
  shouldResumeAddAccountAfterOnboardingSelector,
} from "~/renderer/reducers/onboarding";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { useShouldRedirect } from "~/renderer/hooks/useAutoRedirectToPostOnboarding/useShouldRedirect";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/analytics/originFlow";

/**
 * Resumes the Add Account flow that was interrupted to send the user through device onboarding.
 */
export const useResumeAddAccountAfterOnboarding = (): void => {
  const dispatch = useDispatch();
  const shouldResumeAddAccount = useSelector(shouldResumeAddAccountAfterOnboardingSelector);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { shouldRedirectToRecoverUpsell, shouldRedirectToPostOnboarding } = useShouldRedirect();
  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "portfolio_add_account",
  );

  useEffect(() => {
    if (
      !shouldResumeAddAccount ||
      !hasOnboardedDevice ||
      shouldRedirectToRecoverUpsell ||
      shouldRedirectToPostOnboarding
    ) {
      return;
    }
    dispatch(setShouldResumeAddAccountAfterOnboarding(false));
    setOriginFlow(HOOKS_TRACKING_LOCATIONS.addAccountModal);
    openAssetFlow();
  }, [
    dispatch,
    hasOnboardedDevice,
    openAssetFlow,
    shouldRedirectToPostOnboarding,
    shouldRedirectToRecoverUpsell,
    shouldResumeAddAccount,
  ]);
};
