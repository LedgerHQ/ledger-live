import { useEffect, useRef } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/useWalletFeaturesConfig";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setOnboardingHasDevice } from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";
import { lastSeenDeviceSelector, onboardingHasDeviceSelector } from "~/renderer/reducers/settings";

export const useSyncOnboardingHasDevice = (): void => {
  const dispatch = useDispatch();
  const { shouldUseLazyOnboarding } = useWalletFeaturesConfig("desktop");
  const onboardingHasDevice = useSelector(onboardingHasDeviceSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  const hasTransitioned = useRef(false);
  const initialLastSeenDevice = useRef(lastSeenDevice);

  useEffect(() => {
    if (
      !shouldUseLazyOnboarding ||
      onboardingHasDevice ||
      !lastSeenDevice ||
      hasTransitioned.current
    ) {
      return;
    }

    dispatch(setOnboardingHasDevice(true));

    if (!initialLastSeenDevice.current) {
      track("lazy_onboarding_device_paired");
    }

    hasTransitioned.current = true;
  }, [dispatch, shouldUseLazyOnboarding, onboardingHasDevice, lastSeenDevice]);
};
