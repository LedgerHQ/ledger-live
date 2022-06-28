import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Bullet, Title, Column, IllustrationContainer, AsideFooter } from "../shared";
import getStarted from "../assets/v3/getStarted.png";

const steps = [
  {
    text: "onboarding.screens.tutorial.screens.deviceHowTo2.turnOn.title",
    subText: "onboarding.screens.tutorial.screens.deviceHowTo2.turnOn.descr",
  },
  {
    text: "onboarding.screens.tutorial.screens.deviceHowTo2.browse.title",
    subText: "onboarding.screens.tutorial.screens.deviceHowTo2.browse.descr",
  },
  {
    text: "onboarding.screens.tutorial.screens.deviceHowTo2.select.title",
    subText: "onboarding.screens.tutorial.screens.deviceHowTo2.select.descr",
  },
  {
    text: "onboarding.screens.tutorial.screens.deviceHowTo2.follow.title",
    subText: "onboarding.screens.tutorial.screens.deviceHowTo2.follow.descr",
  },
];

export function DeviceHowTo2() {
  const { t } = useTranslation();

  return (
    <Column>
      <Title>{t("onboarding.screens.tutorial.screens.deviceHowTo2.title")}</Title>
      {steps.map((step, index) => (
        <Bullet key={index} bulletText={index + 1} text={t(step.text)} subText={t(step.subText)} />
      ))}
    </Column>
  );
}

DeviceHowTo2.Illustration = <IllustrationContainer width="240px" height="245px" src={getStarted} />;

const Footer = (props: any) => {
  const { t } = useTranslation();
  return (
    <AsideFooter
      {...props}
      text={t("onboarding.screens.tutorial.screens.deviceHowTo2.help.descr")}
    />
  );
};

DeviceHowTo2.Footer = Footer;

DeviceHowTo2.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.deviceHowTo2.buttons.next" />
);
