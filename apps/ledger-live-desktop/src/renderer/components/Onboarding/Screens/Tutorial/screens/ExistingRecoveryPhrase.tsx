import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, SubTitle, CheckStep, Column } from "../shared";

type Props = {
  userUnderstandConsequences: boolean;
  toggleUserUnderstandConsequences: () => void;
};
export function ExistingRecoveryPhrase({
  userUnderstandConsequences,
  toggleUserUnderstandConsequences,
}: Props) {
  const { t } = useTranslation();

  return (
    <Column>
      <Title>{t("onboarding.screens.tutorial.screens.existingRecoveryPhrase.title")}</Title>
      <SubTitle>
        {t("onboarding.screens.tutorial.screens.existingRecoveryPhrase.paragraph1")}
      </SubTitle>
      <SubTitle>
        {t("onboarding.screens.tutorial.screens.existingRecoveryPhrase.paragraph2")}
      </SubTitle>
      <CheckStep
        data-testid="v3-recovery-phrase-loss-checkbox"
        checked={userUnderstandConsequences}
        onClick={toggleUserUnderstandConsequences}
        label={t("onboarding.screens.tutorial.screens.existingRecoveryPhrase.disclaimer")}
      />
    </Column>
  );
}

ExistingRecoveryPhrase.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.existingRecoveryPhrase.buttons.next" />
);
