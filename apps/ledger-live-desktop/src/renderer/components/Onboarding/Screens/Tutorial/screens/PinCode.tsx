import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, SubTitle, CheckStep, Column } from "../shared";

type Props = {
  toggleUserChosePinCodeHimself: () => void;
  userChosePinCodeHimself: boolean;
};

export function PinCode({ toggleUserChosePinCodeHimself, userChosePinCodeHimself }: Props) {
  const { t } = useTranslation();

  return (
    <Column>
      <Title>{t("onboarding.screens.tutorial.screens.pinCode.title")}</Title>
      <SubTitle>{t("onboarding.screens.tutorial.screens.pinCode.paragraph")}</SubTitle>
      <CheckStep
        data-testid="v3-private-pin-code-checkbox"
        checked={userChosePinCodeHimself}
        onClick={toggleUserChosePinCodeHimself}
        label={t("onboarding.screens.tutorial.screens.pinCode.disclaimer")}
      />
    </Column>
  );
}

PinCode.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.pinCode.buttons.next" />
);
