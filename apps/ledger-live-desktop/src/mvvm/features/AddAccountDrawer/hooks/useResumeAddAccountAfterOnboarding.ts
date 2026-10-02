import { useEffect } from "react";
import { useLocation } from "react-router";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useDispatch, useSelector, useStore } from "LLD/hooks/redux";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import { addAccountResumed, addAccountToResumeSelector } from "~/renderer/reducers/onboarding";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { useShouldRedirect } from "~/renderer/hooks/useAutoRedirectToPostOnboarding/useShouldRedirect";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/analytics/originFlow";

/**
 * Resumes the Add Account flow interrupted by device onboarding, once back on the screen it
 * started from. Mounted app-wide, it reopens Add Account on the same asset. A screen that started
 * it from its own flow passes `resume`: its effect runs first, as a child, and claims the resume.
 */
export const useResumeAddAccountAfterOnboarding = (
  resume?: (currency: CryptoOrTokenCurrency) => void,
): void => {
  const dispatch = useDispatch();
  const store = useStore();
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
    if (addAccountToResumeSelector(store.getState()) !== toResume) return; // already claimed
    dispatch(addAccountResumed());
    setOriginFlow(HOOKS_TRACKING_LOCATIONS.addAccountModal);
    (resume ?? openAddAccountFlow)(toResume.currency);
  }, [
    dispatch,
    hasOnboardedDevice,
    openAddAccountFlow,
    pathname,
    resume,
    shouldRedirectToRecoverUpsell,
    store,
    toResume,
  ]);
};
