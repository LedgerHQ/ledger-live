// @flow

import React, { useCallback, useMemo } from "react";
import { useTheme } from "@react-navigation/native";

import OnboardingStepperView from "../../../components/OnboardingStepperView";
import { ScreenName } from "../../../const";

import { getRecoveryPhraseScenes } from "../shared/infoPagesData";
import SeedWarning from "../shared/SeedWarning";

function OnboardingStepRecoveryPhrase({ navigation, route }: *) {
  const { dark } = useTheme();
  const theme = dark ? "dark" : "light";
  const next = useCallback(() => {
    const { showSeedWarning, ...rest } = route.params; // NB Prevent double warning
    navigation.navigate(ScreenName.OnboardingPairNew, {
      ...rest,
      next: ScreenName.OnboardingFinish,
    });
  }, [navigation, route.params]);

  const { deviceModelId, showSeedWarning } = route.params;

  const scenes = useMemo(() => getRecoveryPhraseScenes(deviceModelId, theme), [
    deviceModelId,
    theme,
  ]);

  return (
    <>
      <OnboardingStepperView
        scenes={scenes}
        navigation={navigation}
        route={route}
        onFinish={next}
      />
      {showSeedWarning ? <SeedWarning deviceModelId={deviceModelId} /> : null}
    </>
  );
}

export default OnboardingStepRecoveryPhrase;
