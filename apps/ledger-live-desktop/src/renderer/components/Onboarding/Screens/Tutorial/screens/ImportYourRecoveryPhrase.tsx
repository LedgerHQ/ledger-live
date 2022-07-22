import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, Column, SubTitle, IllustrationContainer } from "../shared";
import RestorePassPhrase from "../assets/restorePassPhrase.png";

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

ImportYourRecoveryPhrase.Illustration = (
  <IllustrationContainer width="240px" height="245px" src={RestorePassPhrase} />
);

ImportYourRecoveryPhrase.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.importYourRecoveryPhrase.buttons.next" />
);
