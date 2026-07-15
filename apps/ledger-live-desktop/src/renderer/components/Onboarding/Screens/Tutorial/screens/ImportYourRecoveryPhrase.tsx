import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, Column, SubTitle } from "../shared";

export function ImportYourRecoveryPhrase() {
  const { t } = useTranslation();

  return (
    <Column>
      <Title>{t("onboarding.screens.tutorial.screens.importYourRecoveryPhrase.title")}</Title>
      <SubTitle>
        {t("onboarding.screens.tutorial.screens.importYourRecoveryPhrase.paragraph1")}
      </SubTitle>
      <SubTitle>
        {t("onboarding.screens.tutorial.screens.importYourRecoveryPhrase.paragraph2")}
      </SubTitle>
    </Column>
  );
}

ImportYourRecoveryPhrase.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.importYourRecoveryPhrase.buttons.next" />
);
