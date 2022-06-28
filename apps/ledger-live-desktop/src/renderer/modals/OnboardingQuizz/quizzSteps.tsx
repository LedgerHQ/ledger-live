import React from "react";
import { TFunction } from "react-i18next";
import { Icons } from "@ledgerhq/react-ui";

import Illustration from "~/renderer/components/Illustration";

import cryptoStoredQuizzLight from "./assets/cryptoStoredQuizzLight.svg";
import privateKeyQuizzLight from "./assets/privateKeyQuizzLight.svg";
import recoveryPhraseQuizzLight from "./assets/recoveryPhraseQuizzLight.svg";
import rightAnswerQuizzLight from "./assets/rightAnswerQuizzLight.svg";
import wrongAnswerQuizzLight from "./assets/wrongAnswerQuizzLight.svg";

const cryptoStoredQuizzLightIllustration = () => (
  <Illustration
    size={250}
    lightSource={cryptoStoredQuizzLight}
    darkSource={cryptoStoredQuizzLight}
  />
);

const privateKeyQuizzLightIllustration = () => (
  <Illustration size={250} lightSource={privateKeyQuizzLight} darkSource={privateKeyQuizzLight} />
);

const recoveryPhraseQuizzLightIllustration = () => (
  <Illustration
    size={250}
    lightSource={recoveryPhraseQuizzLight}
    darkSource={recoveryPhraseQuizzLight}
  />
);

const rightAnswerQuizzLightIllustration = () => (
  <Illustration size={250} lightSource={rightAnswerQuizzLight} darkSource={rightAnswerQuizzLight} />
);

const wrongAnswerQuizzLightIllustration = () => (
  <Illustration size={250} lightSource={wrongAnswerQuizzLight} darkSource={wrongAnswerQuizzLight} />
);

export const getQuizzSteps = (t: TFunction<"translation", undefined>) => [
  {
    title: t("v3.onboarding.quizz.questions.1.text"),
    Illustration: cryptoStoredQuizzLightIllustration,
    CorrectAnswerIllustration: rightAnswerQuizzLightIllustration,
    IncorrectAnswerIllustration: wrongAnswerQuizzLightIllustration,
    choices: [
      {
        label: t("v3.onboarding.quizz.questions.1.answers.1"),
        correct: false,
      },
      {
        label: t("v3.onboarding.quizz.questions.1.answers.2"),
        correct: true,
      },
    ],
    correctAnswerTitle: t("v3.onboarding.quizz.questions.1.results.success.title"),
    incorrectAnswerTitle: t("v3.onboarding.quizz.questions.1.results.fail.title"),
    correctAnswerExplanation: t("v3.onboarding.quizz.questions.1.results.success.text"),
    incorrectAnswerExplanation: t("v3.onboarding.quizz.questions.1.results.fail.text"),
  },
  {
    title: t("v3.onboarding.quizz.questions.2.text"),
    Illustration: privateKeyQuizzLightIllustration,
    CorrectAnswerIllustration: rightAnswerQuizzLightIllustration,
    IncorrectAnswerIllustration: wrongAnswerQuizzLightIllustration,
    choices: [
      {
        label: t("v3.onboarding.quizz.questions.2.answers.1"),
        correct: false,
      },
      {
        label: t("v3.onboarding.quizz.questions.2.answers.2"),
        correct: true,
      },
    ],
    correctAnswerTitle: t("v3.onboarding.quizz.questions.2.results.success.title"),
    incorrectAnswerTitle: t("v3.onboarding.quizz.questions.2.results.fail.title"),
    correctAnswerExplanation: t("v3.onboarding.quizz.questions.2.results.success.text"),
    incorrectAnswerExplanation: t("v3.onboarding.quizz.questions.2.results.fail.text"),
  },
  {
    title: t("v3.onboarding.quizz.questions.3.text"),
    Illustration: recoveryPhraseQuizzLightIllustration,
    CorrectAnswerIllustration: rightAnswerQuizzLightIllustration,
    IncorrectAnswerIllustration: wrongAnswerQuizzLightIllustration,
    choices: [
      {
        label: t("v3.onboarding.quizz.questions.3.answers.1"),
        correct: true,
      },
      {
        label: t("v3.onboarding.quizz.questions.3.answers.2"),
        correct: false,
      },
    ],
    correctAnswerTitle: t("v3.onboarding.quizz.questions.3.results.success.title"),
    incorrectAnswerTitle: t("v3.onboarding.quizz.questions.3.results.fail.title"),
    correctAnswerExplanation: t("v3.onboarding.quizz.questions.3.results.success.text"),
    incorrectAnswerExplanation: t("v3.onboarding.quizz.questions.3.results.fail.text"),
  },
];
