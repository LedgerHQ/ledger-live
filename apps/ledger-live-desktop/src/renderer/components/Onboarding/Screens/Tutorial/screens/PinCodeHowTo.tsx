import React, { useContext } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, AsideFooter, Column, Bullet, AnimationContainer } from "../shared";

import NanoDeviceCheckIcon from "~/renderer/icons/NanoDeviceCheckIcon";
import NanoDeviceCancelIcon from "~/renderer/icons/NanoDeviceCancelIcon";
import { useTheme } from "styled-components";

import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { OnboardingContext } from "../../../index";

export function PinCodeHowTo() {
  const { colors } = useTheme();
  const color = colors.palette.primary.c80;
  const steps = [
    {
      text: <Trans i18nKey="onboarding.screens.tutorial.screens.pinCodeHowTo.setUp.title" />,
      subText: (
        <Trans i18nKey="onboarding.screens.tutorial.screens.pinCodeHowTo.setUp.descr">
          <NanoDeviceCheckIcon color={color} style={{ margin: "0 4px" }} />
          <NanoDeviceCancelIcon color={color} style={{ margin: "0 4px" }} />
        </Trans>
      ),
    },
    {
      text: <Trans i18nKey="onboarding.screens.tutorial.screens.pinCodeHowTo.confirm.title" />,
      subText: <Trans i18nKey="onboarding.screens.tutorial.screens.pinCodeHowTo.confirm.descr" />,
    },
  ];

  return (
    <Column>
      <Title>
        <Trans i18nKey="onboarding.screens.tutorial.screens.pinCode.title" />
      </Title>
      {steps.map((step, index) => (
        <Bullet key={index} bulletText={index + 1} text={step.text} subText={step.subText} />
      ))}
    </Column>
  );
}

const PinCodeHowToAnimation = () => {
  const { deviceModelId } = useContext(OnboardingContext);

  return (
    <AnimationContainer>
      <Animation animation={getDeviceAnimation(deviceModelId, "light", "plugAndPinCode")} />
    </AnimationContainer>
  );
};

PinCodeHowTo.Illustration = <PinCodeHowToAnimation />;

const Footer = (props: unknown) => {
  const { t } = useTranslation();
  return (
    <AsideFooter
      {...props}
      text={t("onboarding.screens.tutorial.screens.pinCodeHowTo.help.descr")}
    />
  );
};

PinCodeHowTo.Footer = Footer;

PinCodeHowTo.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.pinCodeHowTo.buttons.next" />
);
