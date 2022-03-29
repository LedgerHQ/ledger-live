// @flow

import React, { useCallback } from "react";

import { useDispatch } from "react-redux";
import OnboardingStepperView from "../../../components/OnboardingStepperView";
import { NavigatorName, ScreenName } from "../../../const";

import { importAccountsScenes } from "../shared/infoPagesData";
import { completeOnboarding } from "../../../actions/settings";
import { useNavigationInterceptor } from "../onboardingContext";

const scenes = importAccountsScenes;

function OnboardingStepImportAccounts({ navigation, route }: *) {
  const dispatch = useDispatch();
  const { resetCurrentStep } = useNavigationInterceptor();

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

  const next = useCallback(
    () =>
      navigation.navigate(NavigatorName.ImportAccounts, {
        screen: ScreenName.ScanAccounts,
        params: {
          onFinish,
        },
      }),
    [navigation, onFinish],
  );

  return (
    <OnboardingStepperView
      scenes={scenes}
      navigation={navigation}
      route={route}
      onFinish={next}
    />
  );
}

export default OnboardingStepImportAccounts;
