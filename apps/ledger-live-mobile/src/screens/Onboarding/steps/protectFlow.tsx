import React, { useCallback, useMemo, memo } from "react";
import { useRoute } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { useDispatch } from "react-redux";
import { Linking } from "react-native";
import { ScreenName } from "../../../const";
import BaseStepperView, {
  RestoreWithProtect,
  PinCodeInstructions,
} from "./setupDevice/scenes";
import { TrackScreen } from "../../../analytics";

import StepLottieAnimation from "./setupDevice/scenes/StepLottieAnimation";
import { completeOnboarding } from "../../../actions/settings";
import { useNavigationInterceptor } from "../onboardingContext";
import {
  RootComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import { Step } from "./setupDevice/scenes/BaseStepperView";
import { usePostOnboardingURI } from "../../../hooks/recoverFeatureFlag";

type Metadata = {
  id: string;
  illustration: JSX.Element;
  drawer: null | { route: string; screen: string };
};

type NavigationProps = RootComposite<
  StackNavigatorProps<
    OnboardingNavigatorParamList,
    ScreenName.OnboardingPairNew
  >
>;

const scenes = [RestoreWithProtect, PinCodeInstructions] as Step[];

function OnboardingStepProtectFlow() {
  const { theme } = useTheme();
  const route = useRoute<NavigationProps["route"]>();

  const postOnboardingURI = usePostOnboardingURI();

  const dispatch = useDispatch();
  const { resetCurrentStep } = useNavigationInterceptor();

  const { deviceModelId } = route.params;

  const metadata: Array<Metadata> = useMemo(
    () => [
      {
        id: RestoreWithProtect.id,
        illustration: (
          <StepLottieAnimation
            stepId="recover"
            deviceModelId={deviceModelId}
            theme={theme}
          />
        ),
        drawer: null,
      },
      {
        id: PinCodeInstructions.id,
        illustration: (
          <StepLottieAnimation
            stepId="pinCode"
            deviceModelId={deviceModelId}
            theme={theme}
          />
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

    if (postOnboardingURI)
      Linking.canOpenURL(postOnboardingURI).then(() =>
        Linking.openURL(postOnboardingURI),
      );
  }, [dispatch, postOnboardingURI, resetCurrentStep]);

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
