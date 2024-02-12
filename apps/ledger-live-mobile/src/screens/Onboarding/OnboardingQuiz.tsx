import React, { useCallback, useMemo, useState } from "react";
import { Flex, FlowStepper, Text, Button, Transitions } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { RenderTransitionProps } from "@ledgerhq/native-ui/components/Navigation/FlowStepper/index";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { TrackScreen } from "~/analytics";
import { ScreenName } from "~/const";

import quizImage1 from "~/images/illustration/Light/_056.png";
import quizImage2 from "~/images/illustration/Light/_021.png";
import quizImage3 from "~/images/illustration/Light/_055.png";

import OnboardingQuizItem from "./OnboardingQuizItem";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

const transitionStyles = [StyleSheet.absoluteFill, { flex: 1 }];

const renderTransitionSlide = ({
  activeIndex,
  previousActiveIndex,
  status,
  duration,
  children,
}: RenderTransitionProps) => (
  <Transitions.Slide
    status={status}
    duration={duration}
    direction={(previousActiveIndex || 0) < activeIndex ? "left" : "right"}
    style={transitionStyles}
  >
    {children}
  </Transitions.Slide>
);

type NavigationProp = StackScreenProps<OnboardingNavigatorParamList>;

const Header = ({ step }: { step: number }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp["navigation"]>();
  const route = useRoute<NavigationProp["route"]>();

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <Flex justifyContent="space-between" alignItems="center" flexDirection="row">
      <Button iconName="ArrowLeft" size="large" onPress={onBack} />
      <Flex justifyContent="center" alignItems="center">
        <Text variant="small">
          {t("transfer.lending.enable.stepperHeader.stepRange", {
            currentStep: step,
            totalSteps: 3,
          })}
        </Text>
        <Text variant="h3">{t("onboarding.quizz.label")}</Text>
      </Flex>
      <Button
        iconName="Close"
        size="large"
        onPress={() => {
          // @ts-expect-error Complicated to type this properly
          navigation.navigate(ScreenName.OnboardingPairNew, {
            ...route.params,
          });
        }}
      />
    </Flex>
  );
};

type Props = StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingQuiz>;

function OnboardingQuiz({ navigation, route }: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [bg, setBg] = useState("constant.purple");

  const [userAnswers, setAnswers] = useState(0);

  const quizData = useMemo(
    () =>
      [
        {
          question: t("onboarding.quizz.coins.title"),
          image: quizImage1,
          answers: [
            {
              answer: t("onboarding.quizz.coins.answers.correct"),
              correct: true,
              desc: t("onboarding.quizz.coins.modal.text"),
              title: t("onboarding.quizz.modal.success"),
              testID: "onboarding-quizz-coins-success",
            },
            {
              answer: t("onboarding.quizz.coins.answers.wrong"),
              correct: false,
              desc: t("onboarding.quizz.coins.modal.text"),
              title: t("onboarding.quizz.modal.fail"),
              testID: "onboarding-quizz-coins-fail",
            },
          ].sort(() => 0.5 - Math.random()),
        },
        {
          question: t("onboarding.quizz.recoveryPhrase.title"),
          image: quizImage2,
          answers: [
            {
              answer: t("onboarding.quizz.recoveryPhrase.answers.correct"),
              correct: true,
              desc: t("onboarding.quizz.recoveryPhrase.modal.text"),
              title: t("onboarding.quizz.modal.success"),
              testID: "onboarding-quizz-recoveryPhrase-success",
            },
            {
              answer: t("onboarding.quizz.recoveryPhrase.answers.wrong"),
              correct: false,
              desc: t("onboarding.quizz.recoveryPhrase.modal.text"),
              title: t("onboarding.quizz.modal.fail"),
              testID: "onboarding-quizz-recoveryPhrase-fail",
            },
          ].sort(() => 0.5 - Math.random()),
        },
        {
          question: t("onboarding.quizz.privateKey.title"),
          image: quizImage3,
          answers: [
            {
              answer: t("onboarding.quizz.privateKey.answers.correct"),
              correct: true,
              desc: t("onboarding.quizz.privateKey.modal.text"),
              title: t("onboarding.quizz.modal.success"),
              testID: "onboarding-quizz-privateKey-success",
            },
            {
              answer: t("onboarding.quizz.privateKey.answers.wrong"),
              correct: false,
              desc: t("onboarding.quizz.privateKey.modal.text"),
              title: t("onboarding.quizz.modal.fail"),
              testID: "onboarding-quizz-privateKey-fail",
            },
          ].sort(() => 0.5 - Math.random()),
        },
      ].sort(() => 0.5 - Math.random()),
    [t],
  );

  const next = useCallback(
    () =>
      navigation.navigate(ScreenName.OnboardingQuizFinal, {
        ...route.params,
        success: userAnswers >= 2,
      }) /* TODO */,
    [navigation, route.params, userAnswers],
  );

  const onNext = useCallback(
    (correct: boolean) => {
      if (correct) {
        setAnswers(userAnswers + 1);
      }
      setBg("constant.purple");
      if (index < quizData.length - 1) {
        setIndex(index + 1);
      } else {
        next();
      }
    },
    [index, next, quizData.length, userAnswers],
  );

  return (
    <Flex bg={bg} flex={1}>
      <SafeAreaView style={{ flex: 1 }}>
        <TrackScreen category="Onboarding" name="Quiz" />
        <FlowStepper
          activeIndex={index}
          renderTransition={renderTransitionSlide}
          transitionDuration={500}
          header={() => <Header step={index + 1} />}
          progressBarProps={{ opacity: 0 }}
        >
          {quizData.map((data, i) => (
            <OnboardingQuizItem
              data={data}
              key={i}
              onNext={onNext}
              setBg={setBg}
              cta={
                i < quizData.length - 1
                  ? t("onboarding.quizz.coins.modal.cta")
                  : t("onboarding.quizz.privateKey.modal.cta")
              }
            />
          ))}
        </FlowStepper>
      </SafeAreaView>
    </Flex>
  );
}

export default OnboardingQuiz;
