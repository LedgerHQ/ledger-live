import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, Column, Bullet } from "../shared";

const steps = [
  {
    text: "onboarding.screens.tutorial.screens.recoveryHowTo.enterWord.title",
    subText: "onboarding.screens.tutorial.screens.recoveryHowTo.enterWord.descr",
  },
  {
    text: "onboarding.screens.tutorial.screens.recoveryHowTo.validateWord.title",
    subText: "onboarding.screens.tutorial.screens.recoveryHowTo.validateWord.descr",
  },
  {
    text: "onboarding.screens.tutorial.screens.recoveryHowTo.andNext.title",
  },
];

export function RecoveryHowTo2() {
  const { t } = useTranslation();
  return (
    <Column>
      <Title>
        <Trans i18nKey="onboarding.screens.tutorial.steps.recoveryPhrase" />
      </Title>
      {steps.map((step, index) => (
        <Bullet
          key={index}
          bulletText={index + 3}
          text={t(step.text)}
          subText={step.subText ? t(step.subText) : null}
        />
      ))}
    </Column>
  );
}

RecoveryHowTo2.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.recoveryHowTo.buttons.next" />
);
