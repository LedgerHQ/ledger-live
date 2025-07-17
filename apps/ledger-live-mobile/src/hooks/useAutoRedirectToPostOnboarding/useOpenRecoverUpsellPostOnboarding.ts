import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  Source,
  useAlreadyOnboardedURI,
  useHomeURI,
  usePostOnboardingURI,
  useTouchScreenOnboardingUpsellURI,
} from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PartialRoute, Route, useIsFocused, useNavigation } from "@react-navigation/core";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setHasBeenUpsoldProtect } from "~/actions/settings";
import { internetReachable } from "~/logic/internetReachable";
import { lastConnectedDeviceSelector, onboardingTypeSelector } from "~/reducers/settings";
import { OnboardingType } from "~/reducers/types";
import { RootNavigation } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";

/**
 * Returns a callback to set the navigation state for the Ledger Recover upsell post onboarding
 * */
export function useOpenRecoverUpsellPostOnboarding() {
  const navigation = useNavigation<RootNavigation>();
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
  const startPostOnboarding = useStartPostOnboardingCallback();

  useEffect(() => {
    if (redirectionStarted && !isFocused) {
      dispatch(setHasBeenUpsoldProtect(true));
    }
  }, [redirectionStarted, isFocused, dispatch]);

  return useCallback(async () => {
    const internetConnected = (await internetReachable()) ?? false;
    if (internetConnected && recoverFeature?.enabled) {
      const redirect = (url?: string) => {
        if (lastConnectedDevice !== null) {
          // Set correct post onboarding state
          startPostOnboarding({
            deviceModelId: lastConnectedDevice.modelId,
            disableNavigation: true,
          });
        }

        const routes: PartialRoute<Route<string, object | undefined>>[] = [
          {
            name: NavigatorName.PostOnboarding,
            state: {
              routes: [{ name: ScreenName.PostOnboardingHub }],
            },
          },
        ];

        if (url) {
          const params = new URLSearchParams(url.split("?")[1]);
          routes.push({
            name: ScreenName.Recover,
            params: Object.fromEntries(params.entries()),
          });
          setRedirectionStarted(true);
        }

        navigation.reset({
          index: 1,
          routes: [
            {
              name: NavigatorName.Base,
              state: {
                routes,
              },
            },
          ],
        });
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
      } else {
        redirect();
      }
    }
  }, [
    lastConnectedDevice,
    onboardingType,
    recoverFeature?.enabled,
    recoverAlreadyOnboardedURI,
    recoverHomeURI,
    recoverPostOnboardingURI,
    touchScreenURI,
    navigation,
    startPostOnboarding,
  ]);
}
