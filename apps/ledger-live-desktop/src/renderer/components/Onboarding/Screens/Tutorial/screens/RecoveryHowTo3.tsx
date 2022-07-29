import React, { useContext } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, AsideFooter, Column, Bullet, AnimationContainer } from "../shared";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { OnboardingContext } from "../../../index";

const steps = [
  {
    text: "onboarding.screens.tutorial.screens.recoveryHowTo3.reEnterWord.title",
    subText: "onboarding.screens.tutorial.screens.recoveryHowTo3.reEnterWord.descr",
  },
  {
    text: "onboarding.screens.tutorial.screens.recoveryHowTo3.repeat.title",
  },
];

export function RecoveryHowTo3() {
  const { t } = useTranslation();
  return (
    <Column>
      <Title>
        <Trans i18nKey="onboarding.screens.tutorial.steps.recoveryPhrase" />
      </Title>
      {steps.map((step, index) => (
        <Bullet
          key={index}
          bulletText={index + 3}
          text={t(step.text)}
          subText={step.subText ? t(step.subText) : null}
        />
      ))}
    </Column>
  );
}

const RecoveryHowTo3Animation = () => {
  const { deviceModelId } = useContext(OnboardingContext);

  return (
    <AnimationContainer>
      <Animation animation={getDeviceAnimation(deviceModelId, "light", "plugAndPinCode")} />
    </AnimationContainer>
  );
};

RecoveryHowTo3.Illustration = <RecoveryHowTo3Animation />;

const Footer = (props: any) => {
  const { t } = useTranslation();
  return (
    <AsideFooter
      {...props}
      text={t("onboarding.screens.tutorial.screens.recoveryHowTo3.help.descr")}
    />
  );
};

RecoveryHowTo3.Footer = Footer;

RecoveryHowTo3.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.recoveryHowTo3.buttons.next" />
);
