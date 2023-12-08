import React, { useContext } from "react";
import { Trans, useTranslation } from "react-i18next";
import { AnimationContainer, AsideFooter, Bullet, Column, Title } from "../shared";

import { useTheme } from "styled-components";
import NanoDeviceCancelIcon from "~/renderer/icons/NanoDeviceCancelIcon";
import NanoDeviceCheckIcon from "~/renderer/icons/NanoDeviceCheckIcon";

import { Box, Button, IconsLegacy, Link, Popin, Text } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { urls } from "~/config/urls";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { OnboardingContext } from "../../../index";

export function RecoverHowTo() {
  const theme = useTheme();
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

  const howToUpdateNewLedgerUrl = useLocalizedUrl(urls.howToUpdateNewLedger);
  const onClickArticleLink = () => openURL(howToUpdateNewLedgerUrl);

  const urlFaq = useLocalizedUrl(urls.faq);

  const onClickSupportLink = () => openURL(urlFaq);

  return (
    <Column>
      <Title>
        <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.title" />
      </Title>
      {steps.map((step, index) => (
        <Bullet key={index} bulletText={index + 1} text={step.text} subText={step.subText} />
      ))}
      <Box>
        <Link type={"color"} Icon={IconsLegacy.InfoAltMedium} onClick={() => setIsDrawerOpen(true)}>
          <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.help.iDontSee" />
        </Link>
      </Box>
      <Popin isOpen={isDrawerOpen} style={{ width: "480px", height: "unset" }}>
        <Popin.Header onClose={() => setIsDrawerOpen(false)}>{null}</Popin.Header>
        <Popin.Body>
          <Text variant="h4Inter">
            <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.help.modal.title" />
          </Text>
          <Text variant="bodyLineHeight" color={"neutral.c80"} mt={6}>
            <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.help.modal.subtitle" />
          </Text>
        </Popin.Body>
        <Popin.Footer flexDirection={"column"} mt={8}>
          <Button
            variant="main"
            size={"large"}
            Icon={IconsLegacy.ExternalLinkMedium}
            onClick={onClickArticleLink}
          >
            <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.help.modal.learnHowToUpdate" />
          </Button>
          <Link
            mt={8}
            size={"medium"}
            Icon={IconsLegacy.ExternalLinkMedium}
            onClick={onClickSupportLink}
          >
            <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.help.modal.contactLedgerSupport" />
          </Link>
        </Popin.Footer>
      </Popin>
    </Column>
  );
}

const PinCodeHowToAnimation = () => {
  const { deviceModelId } = useContext(OnboardingContext);

  return (
    <AnimationContainer>
      <Animation
        animation={getDeviceAnimation(
          deviceModelId || DeviceModelId.nanoS,
          "light",
          "recoverWithProtect",
        )}
      />
    </AnimationContainer>
  );
};

RecoverHowTo.Illustration = <PinCodeHowToAnimation />;

const Footer = (props: React.ComponentProps<typeof AsideFooter>) => {
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
