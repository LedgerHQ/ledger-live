import React, { useCallback, useMemo, memo } from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import { StackNavigationProp } from "@react-navigation/stack";
import { DeviceModelId } from "@ledgerhq/devices";
import { ScreenName } from "../../const";
import BaseStepperView, {
  QuizzFinal,
  Metadata,
} from "./steps/setupDevice/scenes";
import { TrackScreen } from "../../analytics";

import quizProSuccessLight from "../../images/illustration/Light/_065.png";
import quizProFailLight from "../../images/illustration/Light/_063.png";

import quizProSuccessDark from "../../images/illustration/Dark/_065.png";
import quizProFailDark from "../../images/illustration/Dark/_063.png";
import Illustration from "../../images/illustration/Illustration";
import { OnboardingNavigatorParamList } from "../../components/RootNavigator/types";

const scenes = [QuizzFinal, QuizzFinal];

function OnboardingStepQuizFinal() {
  const navigation =
    useNavigation<StackNavigationProp<OnboardingNavigatorParamList>>();
  const route = useRoute<
    RouteProp<
      {
        params: {
          success: boolean;
          deviceModelId: DeviceModelId;
        };
      },
      "params"
    >
  >();

  const { success, deviceModelId } = route.params;

  const [lightSource, darkSource] = useMemo(
    () =>
      success
        ? [quizProSuccessLight, quizProSuccessDark]
        : [quizProFailLight, quizProFailDark],
    [success],
  );

  const metadata: Array<Metadata> = useMemo(
    () => [
      {
        id: QuizzFinal.id,
        // @TODO: Replace this placeholder with the correct illustration asap
        illustration: (
          <Illustration
            size={150}
            darkSource={darkSource}
            lightSource={lightSource}
          />
        ),
        drawer: null,
        success,
      },
    ],
    [darkSource, lightSource, success],
  );

  const nextPage = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingPairNew, {
      deviceModelId: route.params.deviceModelId,
      showSeedWarning: false,
    });
  }, [navigation, route.params]);

  return (
    <>
      <TrackScreen category="Onboarding" name="PairNew" />
      <BaseStepperView
        onNext={nextPage}
        steps={scenes}
        metadata={metadata}
        deviceModelId={deviceModelId}
        params={{ success }}
      />
    </>
  );
}

export default memo(OnboardingStepQuizFinal);
