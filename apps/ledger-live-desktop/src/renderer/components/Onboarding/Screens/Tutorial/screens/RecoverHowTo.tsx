import React, { useContext } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, AsideFooter, Column, Bullet, AnimationContainer } from "../shared";

import NanoDeviceCheckIcon from "~/renderer/icons/NanoDeviceCheckIcon";
import NanoDeviceCancelIcon from "~/renderer/icons/NanoDeviceCancelIcon";
import { useTheme } from "styled-components";

import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { OnboardingContext } from "../../../index";
import { Icons, Link, Box } from "@ledgerhq/react-ui";

export function RecoverHowTo() {
  const { colors } = useTheme();
  const color = colors.palette.primary.c80;
  const steps = [
    {
      text: <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.1.title" />,
      subText: (
        <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.1.descr">
          <NanoDeviceCheckIcon color={color} style={{ margin: "0 4px" }} />
          <NanoDeviceCancelIcon color={color} style={{ margin: "0 4px" }} />
        </Trans>
      ),
    },
    {
      text: <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.2.title" />,
      subText: <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.1.descr" />,
    },
  ];

  return (
    <Column>
      <Title>
        <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.title" />
      </Title>
      {steps.map((step, index) => (
        <Bullet key={index} bulletText={index + 1} text={step.text} subText={step.subText} />
      ))}
      <Box>
        <Link type={"color"} Icon={Icons.InfoAltMedium}>
          <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.help.iDontSee" />
        </Link>
      </Box>
    </Column>
  );
}

const PinCodeHowToAnimation = () => {
  const { deviceModelId } = useContext(OnboardingContext);

  return (
    <AnimationContainer>
      <Animation animation={getDeviceAnimation(deviceModelId, "light", "recoverWithProtect")} />
    </AnimationContainer>
  );
};

RecoverHowTo.Illustration = <PinCodeHowToAnimation />;

const Footer = (props: any) => {
  const { t } = useTranslation();
  return (
    <AsideFooter
      {...props}
      text={t("onboarding.screens.tutorial.screens.pinCodeHowTo.help.descr")}
    />
  );
};

RecoverHowTo.Footer = Footer;

RecoverHowTo.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.pinCodeHowTo.buttons.next" />
);
