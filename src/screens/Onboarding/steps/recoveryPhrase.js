// @flow

import React, { useCallback, useMemo } from "react";

import OnboardingStepperView from "../../../components/OnboardingStepperView";
import { ScreenName } from "../../../const";

import { getRecoveryPhraseScenes } from "../shared/infoPagesData";

function OnboardingStepRecoveryPhrase({ navigation, route }: *) {
  const next = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingPairNew, {
      ...route.params,
      next: ScreenName.OnboardingFinish,
    });
  }, [navigation, route.params]);

  const { deviceModelId } = route.params;

  const scenes = useMemo(() => getRecoveryPhraseScenes(deviceModelId), [
    deviceModelId,
  ]);

  return (
    <OnboardingStepperView
      scenes={scenes}
      navigation={navigation}
      route={route}
      onFinish={next}
    />
  );
}

export default OnboardingStepRecoveryPhrase;
