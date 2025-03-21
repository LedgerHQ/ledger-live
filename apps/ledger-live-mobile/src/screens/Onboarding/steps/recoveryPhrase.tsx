import React, { useCallback, useMemo, memo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import Illustration from "~/images/illustration/Illustration";
import BaseStepperView, {
  RestoreRecovery,
  RestoreRecoveryStep1,
  PinCode,
  PinCodeInstructions,
  ExistingRecovery,
  ExistingRecoveryStep1,
  ExistingRecoveryStep2,
} from "./setupDevice/scenes";
import { TrackScreen } from "~/analytics";
import StepLottieAnimation from "./setupDevice/scenes/StepLottieAnimation";
import SeedWarning from "../shared/SeedWarning";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { Step } from "./setupDevice/scenes/BaseStepperView";

// @TODO Replace
const images = {
  light: {
    RestoreRecovery: require("~/images/illustration/Light/_067.webp"),
    RestoreRecoveryStep1: require("~/images/illustration/Light/_067.webp"),
    PinCode: require("~/images/illustration/Light/_062.webp"),
    PinCodeInstructions: require("~/images/illustration/Light/_062.webp"),
    ExistingRecovery: require("~/images/illustration/Light/_059.webp"),
    ExistingRecoveryStep1: require("~/images/illustration/Light/_061.webp"),
    ExistingRecoveryStep2: require("~/images/illustration/Light/_061.webp"),
  },
  dark: {
    RestoreRecovery: require("~/images/illustration/Dark/_067.webp"),
    RestoreRecoveryStep1: require("~/images/illustration/Dark/_067.webp"),
    PinCode: require("~/images/illustration/Dark/_062.webp"),
    PinCodeInstructions: require("~/images/illustration/Dark/_062.webp"),
    ExistingRecovery: require("~/images/illustration/Dark/_059.webp"),
    ExistingRecoveryStep1: require("~/images/illustration/Dark/_061.webp"),
    ExistingRecoveryStep2: require("~/images/illustration/Dark/_061.webp"),
  },
};

type Metadata = {
  id: string;
  illustration: JSX.Element;
  drawer: null | { route: string; screen: string };
};

const scenes = [
  RestoreRecovery,
  RestoreRecoveryStep1,
  PinCode,
  PinCodeInstructions,
  ExistingRecovery,
  ExistingRecoveryStep1,
  ExistingRecoveryStep2,
] as Step[];

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingRecoveryPhrase
>;

function OnboardingStepRecoveryPhrase() {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { theme } = useTheme();
  const route = useRoute<NavigationProps["route"]>();

  const { deviceModelId, showSeedWarning } = route.params;

  const metadata: Array<Metadata> = useMemo(
    () => [
      {
        id: RestoreRecovery.id,
        illustration: (
          <Illustration
            size={150}
            darkSource={images.dark.RestoreRecovery}
            lightSource={images.light.RestoreRecovery}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingGeneralInformation,
          screen: ScreenName.OnboardingGeneralInformation,
        },
      },
      {
        id: RestoreRecoveryStep1.id,
        illustration: (
          <StepLottieAnimation
            stepId="powerOnRecovery"
            deviceModelId={deviceModelId}
            theme={theme === "dark" ? "dark" : "light"}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingGeneralInformation,
          screen: ScreenName.OnboardingGeneralInformation,
        },
      },
      {
        id: PinCode.id,
        illustration: (
          <Illustration
            size={150}
            darkSource={images.dark.PinCode}
            lightSource={images.light.PinCode}
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
            theme={theme === "dark" ? "dark" : "light"}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingSetupDeviceInformation,
          screen: ScreenName.OnboardingSetupDeviceInformation,
        },
      },
      {
        id: ExistingRecovery.id,
        illustration: (
          <Illustration
            size={150}
            darkSource={images.dark.ExistingRecovery}
            lightSource={images.light.ExistingRecovery}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingGeneralInformation,
          screen: ScreenName.OnboardingGeneralInformation,
        },
      },
      {
        id: ExistingRecoveryStep1.id,
        illustration: (
          <Illustration
            size={150}
            darkSource={images.dark.ExistingRecoveryStep1}
            lightSource={images.light.ExistingRecoveryStep1}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingGeneralInformation,
          screen: ScreenName.OnboardingGeneralInformation,
        },
      },
      {
        id: ExistingRecoveryStep2.id,
        illustration: (
          <StepLottieAnimation
            stepId="recover"
            deviceModelId={deviceModelId}
            theme={theme === "dark" ? "dark" : "light"}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingGeneralInformation,
          screen: ScreenName.OnboardingGeneralInformation,
        },
      },
    ],
    [deviceModelId, theme],
  );

  const nextPage = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingPairNew, {
      ...route.params,
      showSeedWarning: false,
    });
  }, [navigation, route.params]);

  return (
    <>
      <TrackScreen category="Onboarding" name="RecoveryPhrase" />
      <BaseStepperView
        onNext={nextPage}
        steps={scenes}
        metadata={metadata}
        deviceModelId={deviceModelId}
      />
      {showSeedWarning ? <SeedWarning deviceModelId={deviceModelId} /> : null}
    </>
  );
}

export default memo(OnboardingStepRecoveryPhrase);
