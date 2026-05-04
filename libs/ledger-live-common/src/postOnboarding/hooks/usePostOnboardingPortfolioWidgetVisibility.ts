import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AccountLike } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { setPostOnboardingWalletEntryPointEligibility } from "../actions";
import {
  postOnboardingDeviceModelIdSelector,
  walletEntryPointEligibleForPortfolioSelector,
} from "../reducer";
import { usePostOnboardingEntryPointVisibleOnWallet } from "./usePostOnboardingEntryPointVisibleOnWallet";

export type UsePostOnboardingPortfolioWidgetVisibilityReturnType = {
  /** Base visibility for the Finish / post-onboarding Portfolio widget (before app feature flags). */
  isPortfolioWidgetBaseVisible: boolean;
};

/**
 * Shared visibility for the Finish / post-onboarding widget on Portfolio (LWD + LWM).
 *
 * True when: post-onboarding entry point visible, device is not Nano S,
 * and the user has no funded accounts (or persisted portfolio eligibility allows it).
 *
 * Compose with app feature flags at the callsite, e.g.
 * `usePostOnboardingPortfolioWidgetVisibility(...).isPortfolioWidgetBaseVisible && shouldDisplayWidget`.
 *
 * @param selectFlattenAccounts — app Redux selector returning flattened accounts (e.g. flattenAccountsSelector)
 */
export function usePostOnboardingPortfolioWidgetVisibility<TState>(
  selectFlattenAccounts: (state: TState) => AccountLike[],
): UsePostOnboardingPortfolioWidgetVisibilityReturnType {
  const dispatch = useDispatch();
  const deviceModelId = useSelector(postOnboardingDeviceModelIdSelector);
  const isPostOnboardingEntryPointVisible = usePostOnboardingEntryPointVisibleOnWallet();
  const eligibility = useSelector(walletEntryPointEligibleForPortfolioSelector);
  const accounts = useSelector(selectFlattenAccounts);

  const hasAccountsWithFunds = useMemo(
    () => accounts.some(account => account?.balance?.isGreaterThan(0)),
    [accounts],
  );

  useEffect(() => {
    if (!deviceModelId || eligibility !== null) return;
    dispatch(setPostOnboardingWalletEntryPointEligibility(!hasAccountsWithFunds));
  }, [deviceModelId, eligibility, dispatch, hasAccountsWithFunds]);

  const isNanoS = deviceModelId === DeviceModelId.nanoS;
  const isEligibleForPortfolio = eligibility ?? !hasAccountsWithFunds;

  return {
    isPortfolioWidgetBaseVisible:
      isPostOnboardingEntryPointVisible && !isNanoS && isEligibleForPortfolio,
  };
}
