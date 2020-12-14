// @flow

import React, { useCallback } from "react";

import OnboardingStepperView from "../../../components/OnboardingStepperView";
import { NavigatorName, ScreenName } from "../../../const";

import { importAccountsScenes } from "../shared/infoPagesData";

const scenes = importAccountsScenes;

function OnboardingStepImportAccounts({ navigation, route }: *) {
  const next = useCallback(
    () =>
      navigation.navigate(NavigatorName.ImportAccounts, {
        screen: ScreenName.ScanAccounts,
        params: {
          onFinish: () => {
            navigation.navigate(ScreenName.OnboardingFinish, {
              ...route.params,
            });
          },
        },
      }),
    [navigation, route.params],
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
