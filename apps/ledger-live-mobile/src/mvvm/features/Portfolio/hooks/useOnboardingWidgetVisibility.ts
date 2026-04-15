import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import {
  postOnboardingDeviceModelIdSelector,
  walletEntryPointEligibleForPortfolioSelector,
} from "@ledgerhq/live-common/postOnboarding/reducer";
import { setPostOnboardingWalletEntryPointEligibility } from "@ledgerhq/live-common/postOnboarding/actions";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import {
  hasCompletedOnboardingSelector,
  onboardingCompletionDateSelector,
} from "~/reducers/settings";
import { addCompletionDate } from "~/actions/settings";

export const useOnboardingWidgetVisibility = () => {
  const dispatch = useDispatch();
  const { shouldDisplayOnboardingWidget } = useWalletFeaturesConfig("mobile");
  const deviceModelId = useSelector(postOnboardingDeviceModelIdSelector);
  const onboardingCompletionDate = useSelector(onboardingCompletionDateSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const isPostOnboardingEntryPointVisible = usePostOnboardingEntryPointVisibleOnWallet();
  const eligibility = useSelector(walletEntryPointEligibleForPortfolioSelector);
  const accounts = useSelector(flattenAccountsSelector);

  const hasAccountsWithFunds = useMemo(
    () => accounts.some(account => account?.balance?.isGreaterThan(0)),
    [accounts],
  );

  const isBeforeCutoffTime = useMemo(() => {
    return onboardingCompletionDate === null
      ? hasCompletedOnboarding
      : differenceInCalendarDays(new Date(), new Date(onboardingCompletionDate)) <= 15;
  }, [onboardingCompletionDate, hasCompletedOnboarding]);

  useEffect(() => {
    // Populate completion dates for all users that have already completed onboarding
    // before completion date was introduced
    if (hasCompletedOnboarding && onboardingCompletionDate === null) {
      dispatch(addCompletionDate());
    }
  }, [hasCompletedOnboarding, onboardingCompletionDate, dispatch]);

  useEffect(() => {
    if (!deviceModelId || eligibility !== null) return;
    dispatch(setPostOnboardingWalletEntryPointEligibility(!hasAccountsWithFunds));
  }, [deviceModelId, eligibility, dispatch, hasAccountsWithFunds]);

  const isNanoS = deviceModelId === DeviceModelId.nanoS;
  const isEligibleForPortfolio = eligibility ?? !hasAccountsWithFunds;

  return (
    shouldDisplayOnboardingWidget &&
    isPostOnboardingEntryPointVisible &&
    !isNanoS &&
    isEligibleForPortfolio &&
    isBeforeCutoffTime
  );
};
