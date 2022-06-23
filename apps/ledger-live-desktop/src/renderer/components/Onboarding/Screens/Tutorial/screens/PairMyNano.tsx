import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, Column, SubTitle, IllustrationContainer, AsideFooter } from "../shared";
import geniuneCheckLight from "../assets/geniuneCheckLight.svg";

export function PairMyNano() {
  const { t } = useTranslation();

  return (
    <Column>
      <Title>{t("onboarding.screens.tutorial.screens.pairMyNano.title")}</Title>
      <SubTitle>{t("onboarding.screens.tutorial.screens.pairMyNano.paragraph")}</SubTitle>
    </Column>
  );
}

PairMyNano.Illustration = (
  <IllustrationContainer width="240px" height="245px" src={geniuneCheckLight} />
);

const Footer = (props: any) => {
  const { t } = useTranslation();
  return (
    <AsideFooter {...props} text={t("onboarding.screens.tutorial.screens.pairMyNano.help.descr")} />
  );
};

PairMyNano.Footer = Footer;

PairMyNano.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.pairMyNano.buttons.next" />
);
