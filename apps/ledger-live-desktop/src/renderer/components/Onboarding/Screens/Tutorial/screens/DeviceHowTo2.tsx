import React, { useContext } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Bullet, Title, Column, AnimationContainer, AsideFooter } from "../shared";

import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { OnboardingContext } from "../../../index";

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

const DeviceHowTo2Animation = () => {
  const { deviceModelId } = useContext(OnboardingContext);

  return (
    <AnimationContainer>
      <Animation animation={getDeviceAnimation(deviceModelId, "light", "plugAndPinCode")} />
    </AnimationContainer>
  );
};

DeviceHowTo2.Illustration = <DeviceHowTo2Animation />;

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
