import React, { useContext, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, AsideFooter, Column, Bullet, AnimationContainer } from "../shared";

import NanoDeviceCheckIcon from "~/renderer/icons/NanoDeviceCheckIcon";
import NanoDeviceCancelIcon from "~/renderer/icons/NanoDeviceCancelIcon";
import { useTheme } from "styled-components";

import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { OnboardingContext, UseCase } from "../../../index";
import {
  Icons,
  Link,
  Box,
  Aside,
  Button,
  Drawer,
  Flex,
  InfiniteLoader,
  Logos,
  ProgressBar,
  Popin,
} from "@ledgerhq/react-ui";
import Text from "../../../../../../../../../libs/ui/packages/react/src/components/asorted/Text";

export function RecoverHowTo() {
  const theme = useTheme();
  console.log("theme", theme)
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const color = theme.colors.palette.primary.c80;
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
        <Link type={"color"} Icon={Icons.InfoAltMedium} onClick={() => setIsDrawerOpen(true)}>
          <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.help.iDontSee" />
        </Link>
      </Box>
      <Popin isOpen={isDrawerOpen} isBackDisplayed={true} isCloseDisplayed={true}>
        <Popin.Header onBack={() => setIsDrawerOpen(false)} onClose={() => setIsDrawerOpen(false)}>
        </Popin.Header>
        <Popin.Body>
          <Text variant="h4Inter">The OS on your Ledger Nano X needs to be updated</Text>

          <Text variant="bodyLineHeight">
            You can try updating the OS or contact Ledger support for assistance.
          </Text>
        </Popin.Body>
        <Popin.Footer>
          <Button variant="main">Next</Button>
          <Button variant="main">Next</Button>
        </Popin.Footer>
      </Popin>
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
