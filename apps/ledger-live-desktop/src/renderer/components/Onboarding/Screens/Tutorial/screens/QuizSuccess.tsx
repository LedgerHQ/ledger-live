import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, SubTitle, Column, IllustrationContainer } from "../shared";
import successQuizzLight from "../assets/successQuizzLight.svg";

export function QuizSuccess() {
  const { t } = useTranslation();

  return (
    <Column>
      <Title>{t("onboarding.screens.tutorial.screens.quizSuccess.title")}</Title>
      <SubTitle>{t("onboarding.screens.tutorial.screens.quizSuccess.paragraph")}</SubTitle>
    </Column>
  );
}

QuizSuccess.Illustration = (
  <IllustrationContainer width="240px" height="245px" src={successQuizzLight} />
);

QuizSuccess.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.quizSuccess.buttons.next" />
);
