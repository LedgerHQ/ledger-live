import React, { useEffect } from "react";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { OnboardingStep } from "@ledgerhq/live-common/hw/extractOnboardingState";
import TrackScreen from "~/analytics/TrackScreen";
import GenericErrorView from "~/components/GenericErrorView";
import { useLocale } from "~/context/Locale";
import WebRecoverPlayer from "~/components/WebRecoverPlayer";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { DeviceModelId } from "@ledgerhq/devices";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useSelector } from "react-redux";

export type Props = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.Recover>
>;

const appManifestNotFoundError = new Error("App not found"); // FIXME move this elsewhere.

const pollingPeriodMs = 1000;

export function RecoverPlayer({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { platform: appId, device, fromOnboarding, ...params } = route.params || {};
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const { locale } = useLocale();
  const currencySettings = useSelector(counterValueCurrencySelector);
  const currency = currencySettings.ticker;
  const manifest = localManifest || remoteManifest;

  const { onboardingState } = useOnboardingStatePolling({
    device: device || null,
    pollingPeriodMs,
    // stop polling if not coming from the onboarding
    stopPolling: !fromOnboarding,
  });

  useEffect(() => {
    if (
      device &&
      fromOnboarding &&
      onboardingState &&
      onboardingState.currentOnboardingStep !== OnboardingStep.RecoverRestore
    ) {
      if (device.modelId === DeviceModelId.stax) {
        navigation.navigate(NavigatorName.BaseOnboarding, {
          screen: NavigatorName.SyncOnboarding,
          params: {
            screen: ScreenName.SyncOnboardingCompanion,
            params: {
              device,
            },
          },
        });
      } else {
        navigation.navigate(NavigatorName.BaseOnboarding, {
          screen: NavigatorName.Onboarding,
          params: {
            screen: ScreenName.OnboardingProtectFlow,
            params: {
              deviceModelId: device.modelId,
            },
          },
        });
      }
    }
  }, [device, fromOnboarding, navigation, onboardingState]);

  return manifest ? (
    <>
      <TrackScreen category="Platform" name="App" />
      <WebRecoverPlayer
        manifest={manifest}
        inputs={{
          theme,
          lang: locale,
          currency,
          deviceId: device?.deviceId,
          ...params,
        }}
      />
    </>
  ) : (
    <Flex flex={1} p={10} justifyContent="center" alignItems="center">
      {remoteLiveAppState.isLoading ? (
        <InfiniteLoader />
      ) : (
        <GenericErrorView error={appManifestNotFoundError} />
      )}
    </Flex>
  );
}
