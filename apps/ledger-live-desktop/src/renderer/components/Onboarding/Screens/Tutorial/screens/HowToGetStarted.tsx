import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Bullet, Title, Column } from "../shared";

export function HowToGetStarted() {
  const { t } = useTranslation();

  return (
    <Column>
      <Title>{t("onboarding.screens.tutorial.screens.howToGetStarted.title")}</Title>
      <Bullet
        icon={"Clock"}
        text={t("onboarding.screens.tutorial.screens.howToGetStarted.rules.1")}
      />
      <Bullet
        icon={"Pen"}
        text={t("onboarding.screens.tutorial.screens.howToGetStarted.rules.2")}
      />
      <Bullet
        icon={"Coffee"}
        text={t("onboarding.screens.tutorial.screens.howToGetStarted.rules.3")}
      />
    </Column>
  );
}

HowToGetStarted.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.howToGetStarted.buttons.next" />
);
