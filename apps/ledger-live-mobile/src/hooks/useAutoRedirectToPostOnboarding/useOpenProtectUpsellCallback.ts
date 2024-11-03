import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  Source,
  useAlreadyOnboardedURI,
  useHomeURI,
  usePostOnboardingURI,
  useTouchScreenOnboardingUpsellURI,
} from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useIsFocused } from "@react-navigation/core";
import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { setHasBeenUpsoldProtect } from "~/actions/settings";
import { internetReachable } from "~/logic/internetReachable";
import { lastConnectedDeviceSelector, onboardingTypeSelector } from "~/reducers/settings";
import { OnboardingType } from "~/reducers/types";

/**
 * Returns a callback to open the Protect (Ledger Recover) upsell
 * */
export function useOpenProtectUpsellCallback() {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const onboardingType = useSelector(onboardingTypeSelector);
  const protectFeature = useFeature("protectServicesMobile");
  const recoverAlreadyOnboardedURI = useAlreadyOnboardedURI(protectFeature);
  const recoverPostOnboardingURI = usePostOnboardingURI(protectFeature);
  const touchScreenURI = useTouchScreenOnboardingUpsellURI(
    protectFeature,
    Source.LLM_ONBOARDING_24,
  );
  const recoverHomeURI = useHomeURI(protectFeature);
  const dispatch = useDispatch();
  const [redirectionStarted, setRedirectionStarted] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (redirectionStarted && !isFocused) {
      dispatch(setHasBeenUpsoldProtect(true));
    }
  }, [redirectionStarted, isFocused, dispatch]);

  return useCallback(async () => {
    const internetConnected = await internetReachable();
    if (internetConnected && protectFeature?.enabled) {
      const redirect = (url: string) => {
        Linking.openURL(url);
        setRedirectionStarted(true);
      };
      if (
        lastConnectedDevice &&
        touchScreenURI &&
        [DeviceModelId.stax, DeviceModelId.europa].includes(lastConnectedDevice.modelId)
      ) {
        redirect(touchScreenURI);
      } else if (recoverPostOnboardingURI && onboardingType === OnboardingType.restore) {
        redirect(recoverPostOnboardingURI);
      } else if (recoverHomeURI && onboardingType === OnboardingType.setupNew) {
        redirect(recoverHomeURI);
      } else if (recoverAlreadyOnboardedURI) {
        redirect(recoverAlreadyOnboardedURI);
      }
    }
  }, [
    lastConnectedDevice,
    onboardingType,
    protectFeature?.enabled,
    recoverAlreadyOnboardedURI,
    recoverHomeURI,
    recoverPostOnboardingURI,
    touchScreenURI,
  ]);
}
