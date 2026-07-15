import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, SubTitle, CheckStep, Column } from "../shared";

type Props = {
  toggleUserUnderstandConsequences: () => void;
  userUnderstandConsequences: boolean;
};

export function NewRecoveryPhrase({
  userUnderstandConsequences,
  toggleUserUnderstandConsequences,
}: Props) {
  const { t } = useTranslation();

  return (
    <Column>
      <Title>{t("onboarding.screens.tutorial.screens.newRecoveryPhrase.title")}</Title>
      <SubTitle>{t("onboarding.screens.tutorial.screens.newRecoveryPhrase.paragraph1")}</SubTitle>
      <SubTitle>{t("onboarding.screens.tutorial.screens.newRecoveryPhrase.paragraph2")}</SubTitle>
      <CheckStep
        data-testid="v3-recovery-phrase-checkbox"
        checked={userUnderstandConsequences}
        onClick={toggleUserUnderstandConsequences}
        label={t("onboarding.screens.tutorial.screens.newRecoveryPhrase.disclaimer")}
      />
    </Column>
  );
}

NewRecoveryPhrase.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.newRecoveryPhrase.buttons.next" />
);
