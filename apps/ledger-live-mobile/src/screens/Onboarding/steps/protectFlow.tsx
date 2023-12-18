import React, { useCallback, useMemo, memo } from "react";
import { useTheme } from "styled-components/native";
import { useDispatch, useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { NavigatorName, ScreenName } from "~/const";
import BaseStepperView, { RestoreWithProtect, PinCodeInstructions } from "./setupDevice/scenes";
import { TrackScreen } from "~/analytics";

import StepLottieAnimation from "./setupDevice/scenes/StepLottieAnimation";
import { completeOnboarding } from "~/actions/settings";
import { useNavigationInterceptor } from "../onboardingContext";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { Step } from "./setupDevice/scenes/BaseStepperView";
import { hasCompletedOnboardingSelector, lastConnectedDeviceSelector } from "~/reducers/settings";

type Metadata = {
  id: string;
  illustration: JSX.Element;
  drawer: null | { route: string; screen: string };
};

type NavigationProps = BaseComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingProtectFlow>
>;

const scenes = [RestoreWithProtect, PinCodeInstructions] as Step[];

function OnboardingStepProtectFlow({ navigation, route }: NavigationProps) {
  const { theme } = useTheme();

  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const protectFeature = useFeature("protectServicesMobile");

  const dispatch = useDispatch();
  const { resetCurrentStep } = useNavigationInterceptor();

  const { deviceModelId } = route.params;

  const metadata: Array<Metadata> = useMemo(
    () => [
      {
        id: RestoreWithProtect.id,
        illustration: (
          <StepLottieAnimation stepId="recover" deviceModelId={deviceModelId} theme={theme} />
        ),
        drawer: null,
      },
      {
        id: PinCodeInstructions.id,
        illustration: (
          <StepLottieAnimation stepId="pinCode" deviceModelId={deviceModelId} theme={theme} />
        ),
        drawer: {
          route: ScreenName.OnboardingSetupDeviceInformation,
          screen: ScreenName.OnboardingSetupDeviceInformation,
        },
      },
    ],
    [deviceModelId, theme],
  );

  const onFinish = useCallback(() => {
    dispatch(completeOnboarding());
    resetCurrentStep();

    if (protectFeature?.enabled && (lastConnectedDevice || !hasCompletedOnboarding)) {
      navigation.navigate(NavigatorName.Base, {
        screen: ScreenName.Recover,
        params: {
          device: lastConnectedDevice || undefined,
          platform: protectFeature.params?.protectId,
          redirectTo: "restore",
          date: new Date().toISOString(), // adding a date to reload the page in case of same device restored again
        },
      });
    }
  }, [
    dispatch,
    hasCompletedOnboarding,
    lastConnectedDevice,
    navigation,
    protectFeature?.enabled,
    protectFeature?.params?.protectId,
    resetCurrentStep,
  ]);

  const nextPage = useCallback(() => {
    onFinish();
  }, [onFinish]);

  return (
    <>
      <TrackScreen category="Onboarding" name="PairNew" />
      <BaseStepperView
        onNext={nextPage}
        steps={scenes}
        metadata={metadata}
        deviceModelId={deviceModelId}
      />
    </>
  );
}

export default memo(OnboardingStepProtectFlow);
