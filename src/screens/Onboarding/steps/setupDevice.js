// @flow

import React, { useCallback, useMemo } from "react";

import OnboardingStepperView from "../../../components/OnboardingStepperView";
import { ScreenName } from "../../../const";

import { getSetupDeviceScenes } from "../shared/infoPagesData";

function OnboardingStepNewDevice({ navigation, route }: *) {
  const { deviceModelId } = route.params;
  const next = useCallback(
    () =>
      navigation.navigate(ScreenName.OnboardingQuiz, {
        ...route.params,
      }),
    [navigation, route.params],
  );

  const scenes = useMemo(() => getSetupDeviceScenes(deviceModelId), [
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

export default OnboardingStepNewDevice;
