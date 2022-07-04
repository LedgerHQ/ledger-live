import React, { useContext } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Bullet, Title, Column, AnimationContainer, AsideFooter } from "../shared";

import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { OnboardingContext } from "../../../index.v3";

const steps = [
  {
    text: "onboarding.screens.tutorial.screens.deviceHowTo.turnOn.title",
    subText: "onboarding.screens.tutorial.screens.deviceHowTo.turnOn.descr",
  },
  {
    text: "onboarding.screens.tutorial.screens.deviceHowTo.browse.title",
    subText: "onboarding.screens.tutorial.screens.deviceHowTo.browse.descr",
  },
  {
    text: "onboarding.screens.tutorial.screens.deviceHowTo.select.title",
    subText: "onboarding.screens.tutorial.screens.deviceHowTo.select.descr",
  },
  {
    text: "onboarding.screens.tutorial.screens.deviceHowTo.follow.title",
    subText: "onboarding.screens.tutorial.screens.deviceHowTo.follow.descr",
  },
];

export function DeviceHowTo() {
  const { t } = useTranslation();

  return (
    <Column>
      <Title>{t("onboarding.screens.tutorial.screens.howToGetStarted.title")}</Title>
      {steps.map((step, index) => (
        <Bullet key={index} bulletText={index + 1} text={t(step.text)} subText={t(step.subText)} />
      ))}
    </Column>
  );
}

const DeviceHowToAnimation = () => {
  const { deviceModelId } = useContext(OnboardingContext);

  return (
    <AnimationContainer>
      <Animation animation={getDeviceAnimation(deviceModelId, "light", "plugAndPinCode")} />
    </AnimationContainer>
  );
};

DeviceHowTo.Illustration = <DeviceHowToAnimation />;

const Footer = (props: any) => {
  const { t } = useTranslation();
  return (
    <AsideFooter
      {...props}
      text={t("onboarding.screens.tutorial.screens.deviceHowTo.help.descr")}
    />
  );
};

DeviceHowTo.Footer = Footer;

DeviceHowTo.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.deviceHowTo.buttons.next" />
);
