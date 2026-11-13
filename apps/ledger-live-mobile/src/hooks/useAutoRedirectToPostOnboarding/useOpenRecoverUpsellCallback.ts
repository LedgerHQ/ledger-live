import { useFeature } from "@features/platform-feature-flags";
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
import { useSelector, useDispatch } from "~/context/hooks";
import { setHasBeenUpsoldProtect } from "~/actions/settings";
import { internetReachable } from "~/logic/internetReachable";
import { lastConnectedDeviceSelector, onboardingTypeSelector } from "~/reducers/settings";
import { OnboardingType } from "~/reducers/types";

/**
 * Returns a callback to open the Ledger Recover upsell, resolving to whether it opened
 * */
export function useOpenRecoverUpsellCallback() {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const onboardingType = useSelector(onboardingTypeSelector);
  const recoverFeature = useFeature("protectServicesMobile");
  const recoverAlreadyOnboardedURI = useAlreadyOnboardedURI(recoverFeature);
  const recoverPostOnboardingURI = usePostOnboardingURI(recoverFeature);
  const touchScreenURI = useTouchScreenOnboardingUpsellURI(
    recoverFeature,
    Source.LLM_ONBOARDING_24,
  );
  const recoverHomeURI = useHomeURI(recoverFeature);
  const dispatch = useDispatch();
  const [redirectionStarted, setRedirectionStarted] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (redirectionStarted && !isFocused) {
      dispatch(setHasBeenUpsoldProtect(true));
    }
  }, [redirectionStarted, isFocused, dispatch]);

  return useCallback(async (): Promise<boolean> => {
    const internetConnected = await internetReachable();
    if (!internetConnected || !recoverFeature?.enabled) return false;

    const redirect = async (url: string) => {
      try {
        await Linking.openURL(url);
      } catch {
        return false;
      }
      setRedirectionStarted(true);
      return true;
    };
    if (
      lastConnectedDevice &&
      touchScreenURI &&
      [DeviceModelId.stax, DeviceModelId.europa].includes(lastConnectedDevice.modelId)
    ) {
      return redirect(touchScreenURI);
    }
    if (recoverPostOnboardingURI && onboardingType === OnboardingType.restore) {
      return redirect(recoverPostOnboardingURI);
    }
    if (recoverHomeURI && onboardingType === OnboardingType.setupNew) {
      return redirect(recoverHomeURI);
    }
    if (recoverAlreadyOnboardedURI) {
      return redirect(recoverAlreadyOnboardedURI);
    }
    return false;
  }, [
    lastConnectedDevice,
    onboardingType,
    recoverFeature?.enabled,
    recoverAlreadyOnboardedURI,
    recoverHomeURI,
    recoverPostOnboardingURI,
    touchScreenURI,
  ]);
}
