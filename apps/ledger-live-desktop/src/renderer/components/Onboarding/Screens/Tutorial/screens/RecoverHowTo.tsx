import React, { useCallback, useContext } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, AsideFooter, Column, Bullet, AnimationContainer } from "../shared";

import NanoDeviceCheckIcon from "~/renderer/icons/NanoDeviceCheckIcon";
import NanoDeviceCancelIcon from "~/renderer/icons/NanoDeviceCancelIcon";
import { useTheme } from "styled-components";

import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { OnboardingContext } from "../../../index";
import { Icons, Link, Box, Button, Popin, Text } from "@ledgerhq/react-ui";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";

export function RecoverHowTo() {
  const theme = useTheme();
  const locale = useSelector(languageSelector) || "en";
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

  const onClickArticleLink = useCallback(() => openURL(urls.howToUpdateNewLedger), []);

  const onClickSupportLink = useCallback(
    () => openURL(urls.faq[locale in urls.faq ? locale : "en"]),
    [locale],
  );

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
      <Popin isOpen={isDrawerOpen} style={{ width: "480px", height: "unset" }}>
        <Popin.Header onClose={() => setIsDrawerOpen(false)}></Popin.Header>
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
            Icon={Icons.ExternalLinkMedium}
            onClick={onClickArticleLink}
          >
            <Trans i18nKey="onboarding.screens.tutorial.screens.recoverHowTo.help.modal.learnHowToUpdate" />
          </Button>
          <Link mt={8} size={"medium"} Icon={Icons.ExternalLinkMedium} onClick={onClickSupportLink}>
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
