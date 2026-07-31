import {
  getLazyOnboardingBannerDecision,
  useLazyOnboardingBannerSession,
} from "@features/flow-lazy-onboarding-banner";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import {
  hasCompletedOnboardingSelector,
  isRebornSelector,
  onboardingHasDeviceSelector,
  readOnlyModeEnabledSelector,
  seenDevicesSelector,
} from "~/reducers/settings";

export type LazyOnboardingBannerState = Readonly<{
  isShown: boolean;
  link: string;
  dismiss: () => void;
}>;

export function useLazyOnboardingBannerState(): LazyOnboardingBannerState {
  const feature = useFeature("lazyOnboardingBanner");
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const isReadOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const onboardingHasDevice = useSelector(onboardingHasDeviceSelector);
  const isReborn = useSelector(isRebornSelector);
  const seenDevices = useSelector(seenDevicesSelector);
  const hasLastConnectedDevice = useSelector(state => state.settings.lastConnectedDevice !== null);
  const { isDismissed, dismiss } = useLazyOnboardingBannerSession();

  const decision = getLazyOnboardingBannerDecision(
    {
      hasCompletedOnboarding,
      isReadOnlyModeEnabled,
      onboardingHasDevice,
      isReborn,
      hasEverConnectedDevice: seenDevices.length > 0 || hasLastConnectedDevice,
      isDismissed,
    },
    { isFeatureEnabled: feature?.enabled === true },
  );

  return {
    isShown: decision.shouldShow,
    link: feature?.params?.link ?? "",
    dismiss,
  };
}
