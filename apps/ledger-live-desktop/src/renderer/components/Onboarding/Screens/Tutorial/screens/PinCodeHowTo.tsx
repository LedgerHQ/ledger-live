import React from "react";
import { Trans } from "react-i18next";
import { Title, Column, Bullet } from "../shared";
import NanoDeviceCheckIcon from "~/renderer/icons/NanoDeviceCheckIcon";
import NanoDeviceCancelIcon from "~/renderer/icons/NanoDeviceCancelIcon";
import { useTheme } from "styled-components";

export function PinCodeHowTo() {
  const { colors } = useTheme();
  const color = colors.primary.c80;
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

PinCodeHowTo.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.pinCodeHowTo.buttons.next" />
);
