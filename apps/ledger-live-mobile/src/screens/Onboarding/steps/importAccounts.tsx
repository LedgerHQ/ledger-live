import React, { useCallback } from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import { useDispatch } from "react-redux";
import Illustration from "../../../images/illustration/Illustration";
import { NavigatorName, ScreenName } from "../../../const";
import { DeviceNames } from "../types";
import BaseStepperView, { SyncDesktop, Metadata } from "./setupDevice/scenes";
import { TrackScreen } from "../../../analytics";

import {
  completeOnboarding,
  setHasOrderedNano,
  setReadOnlyMode,
} from "../../../actions/settings";
import { useNavigationInterceptor } from "../onboardingContext";

const images = {
  light: {
    Intro: require("../../../images/illustration/Light/_074.png"),
  },
  dark: {
    Intro: require("../../../images/illustration/Dark/_074.png"),
  },
};

const scenes = [SyncDesktop, SyncDesktop];

function OnboardingStepPairNew() {
  const navigation = useNavigation();
  const route = useRoute<
    RouteProp<
      {
        params: {
          deviceModelId: DeviceNames;
        };
      },
      "params"
    >
  >();

  const deviceModelId = route?.params?.deviceModelId;

  const dispatch = useDispatch();
  const { resetCurrentStep } = useNavigationInterceptor();

  const metadata: Array<Metadata> = [
    {
      id: SyncDesktop.id,
      // @TODO: Replace this placeholder with the correct illustration asap
      illustration: (
        <Illustration
          size={200}
          darkSource={images.dark.Intro}
          lightSource={images.light.Intro}
        />
      ),
      drawer: null,
    },
  ];

  const onFinish = useCallback(() => {
    dispatch(completeOnboarding());
    dispatch(setReadOnlyMode(false));
    dispatch(setHasOrderedNano(false));
    resetCurrentStep();

    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.popToTop();
    }

    navigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [dispatch, navigation, resetCurrentStep]);

  const onNext = useCallback(() => {
    navigation.navigate(NavigatorName.ImportAccounts, {
      screen: ScreenName.ScanAccounts,
      params: {
        onFinish,
      },
    });
  }, [navigation, onFinish]);

  const nextPage = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingModalWarning, {
      screen: ScreenName.OnboardingModalSyncDesktopInformation,
      params: { onNext },
    });
  }, [navigation, onNext]);

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

export default OnboardingStepPairNew;
