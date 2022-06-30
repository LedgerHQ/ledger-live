import React from "react";
import { TFunction } from "react-i18next";
import { Icons } from "@ledgerhq/react-ui";

import Illustration from "~/renderer/components/Illustration";

import cryptoStoredQuizz from "./assets/cryptoStoredQuizz.png";
import privateKeyQuizz from "./assets/privateKeyQuizz.png";
import recoveryPhraseQuizz from "./assets/recoveryPhraseQuizz.png";
import rightAnswerQuizz from "./assets/rightAnswerQuizz.png";
import wrongAnswerQuizz from "./assets/wrongAnswerQuizz.png";

const cryptoStoredQuizzIllustration = () => (
  <Illustration size={250} lightSource={cryptoStoredQuizz} darkSource={cryptoStoredQuizz} />
);

const privateKeyQuizzIllustration = () => (
  <Illustration size={250} lightSource={privateKeyQuizz} darkSource={privateKeyQuizz} />
);

const recoveryPhraseQuizzIllustration = () => (
  <Illustration size={250} lightSource={recoveryPhraseQuizz} darkSource={recoveryPhraseQuizz} />
);

const rightAnswerQuizzIllustration = () => (
  <Illustration size={250} lightSource={rightAnswerQuizz} darkSource={rightAnswerQuizz} />
);

const wrongAnswerQuizzIllustration = () => (
  <Illustration size={250} lightSource={wrongAnswerQuizz} darkSource={wrongAnswerQuizz} />
);

export const getQuizzSteps = (t: TFunction<"translation", undefined>) => [
  {
    title: t("v3.onboarding.quizz.questions.1.text"),
    Illustration: cryptoStoredQuizzIllustration,
    CorrectAnswerIllustration: rightAnswerQuizzIllustration,
    IncorrectAnswerIllustration: wrongAnswerQuizzIllustration,
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
    Illustration: privateKeyQuizzIllustration,
    CorrectAnswerIllustration: rightAnswerQuizzIllustration,
    IncorrectAnswerIllustration: wrongAnswerQuizzIllustration,
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
    Illustration: recoveryPhraseQuizzIllustration,
    CorrectAnswerIllustration: rightAnswerQuizzIllustration,
    IncorrectAnswerIllustration: wrongAnswerQuizzIllustration,
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
