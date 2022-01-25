// @flow
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import OnboardingStepperView from "../../components/OnboardingStepperView";
import { ScreenName } from "../../const";
import quizProSuccess from "./assets/quizPro1.png";
import quizProFail from "./assets/quizPro2.png";

const OnboardingQuizFinal = ({ navigation, route }: *) => {
  const { success } = route.params;

  const next = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingPairNew, {
      ...route.params,
      next: ScreenName.OnboardingFinish,
    });
  }, [navigation, route.params]);

  const scene = [
    {
      id: "quizFinal",
      type: "primary",
      sceneProps: {
        image: success ? quizProSuccess : quizProFail,
        title: (
          <Trans
            i18nKey={`onboarding.quizz.final.${
              success ? "successTitle" : "failTitle"
            }`}
          />
        ),
        ctaText: <Trans i18nKey="onboarding.quizz.final.cta" />,
        descs: [
          <Trans
            i18nKey={`onboarding.quizz.final.${
              success ? "successText" : "failText"
            }`}
          />,
        ],
      },
    },
  ];

  return (
    <OnboardingStepperView
      scenes={scene}
      navigation={navigation}
      route={route}
      onFinish={next}
      hideStepper
    />
  );
};

export default OnboardingQuizFinal;
