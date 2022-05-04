import React, { useCallback, useMemo, memo } from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { useDispatch } from "react-redux";
import { NavigatorName, ScreenName } from "../../../const";
import { DeviceNames } from "../types";
import BaseStepperView, { PairNew, ConnectNano } from "./setupDevice/scenes";
import { TrackScreen } from "../../../analytics";
import SeedWarning from "../shared/SeedWarning";
import Illustration from "../../../images/illustration/Illustration";

import StepLottieAnimation from "./setupDevice/scenes/StepLottieAnimation";
import { completeOnboarding } from "../../../actions/settings";
import { useNavigationInterceptor } from "../onboardingContext";

const images = {
  light: {
    Intro: require("../../../images/illustration/Light/_076.png"),
  },
  dark: {
    Intro: require("../../../images/illustration/Dark/_076.png"),
  },
};

type Metadata = {
  id: string;
  illustration: JSX.Element;
  drawer: null | { route: string; screen: string };
};

const scenes = [PairNew, ConnectNano];

function OnboardingStepPairNew() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const route = useRoute<
    RouteProp<
      {
        params: {
          deviceModelId: DeviceNames;
          next: any;
          showSeedWarning: boolean;
        };
      },
      "params"
    >
  >();

  const dispatch = useDispatch();
  const { resetCurrentStep } = useNavigationInterceptor();

  const { deviceModelId, showSeedWarning } = route.params;

  const metadata: Array<Metadata> = useMemo(
    () => [
      {
        id: PairNew.id,
        illustration: (
          <Illustration
            size={150}
            darkSource={images.dark.Intro}
            lightSource={images.light.Intro}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingBluetoothInformation,
          screen: ScreenName.OnboardingBluetoothInformation,
        },
      },
      {
        id: ConnectNano.id,
        illustration: (
          <StepLottieAnimation
            stepId="pinCode"
            deviceModelId={deviceModelId}
            theme={theme === "dark" ? "dark" : "light"}
          />
        ),
        drawer: {
          route: ScreenName.OnboardingBluetoothInformation,
          screen: ScreenName.OnboardingBluetoothInformation,
        },
      },
    ],
    [deviceModelId, theme],
  );

  const onFinish = useCallback(() => {
    dispatch(completeOnboarding());
    resetCurrentStep();

    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.popToTop();
    }

    navigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [dispatch, navigation, resetCurrentStep]);

  const nextPage = useCallback(() => {
    onFinish();
    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    // navigation.navigate(ScreenName.OnboardingFinish, {
    //  ...route.params,
    // });
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
      {showSeedWarning ? <SeedWarning deviceModelId={deviceModelId} /> : null}
    </>
  );
}

export default memo(OnboardingStepPairNew);
