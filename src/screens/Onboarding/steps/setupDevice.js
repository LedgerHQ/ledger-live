// @flow

import React, { useCallback, useMemo } from "react";
import { useTheme } from "@react-navigation/native";

import OnboardingStepperView from "../../../components/OnboardingStepperView";
import { ScreenName } from "../../../const";

import { getSetupDeviceScenes } from "../shared/infoPagesData";

function OnboardingStepNewDevice({ navigation, route }: *) {
  const { deviceModelId } = route.params;
  const { dark } = useTheme();
  const theme = dark ? "dark" : "light";

  const next = useCallback(
    () =>
      navigation.navigate(ScreenName.OnboardingQuiz, {
        ...route.params,
      }),
    [navigation, route.params],
  );

  const scenes = useMemo(() => getSetupDeviceScenes(deviceModelId, theme), [
    deviceModelId,
    theme,
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
