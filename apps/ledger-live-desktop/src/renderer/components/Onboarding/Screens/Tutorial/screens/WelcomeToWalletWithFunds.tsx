import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, Column, SubTitle, TrackTutorialProps } from "../shared";
import { Flex, Icons } from "@ledgerhq/react-ui/index";
import TrackPage from "~/renderer/analytics/TrackPage";

export function WelcomeToWalletWithFunds(trackProps: TrackTutorialProps) {
  const { t } = useTranslation();

  return (
    <Column>
      <TrackPage
        category="Set up device"
        name="End of onboarding"
        receiveFlowEnded={true}
        flow={trackProps.flow}
        deviceModelId={trackProps.deviceModelId}
        seedConfiguration={trackProps.seedConfiguration}
      />
      <Title>{t("onboarding.screens.tutorial.screens.welcomeToWalletWithFunds.title")}</Title>
      <SubTitle>
        {t("onboarding.screens.tutorial.screens.welcomeToWalletWithFunds.description")}
      </SubTitle>
      <Flex flex={1} justifyContent="center" mt="150px">
        <Flex
          width={72}
          height={72}
          borderRadius={100}
          bg="opacityDefault.c05"
          alignItems="center"
          justifyContent="center"
        >
          <Icons.CheckmarkCircleFill color="success.c70" size="L" />
        </Flex>
      </Flex>
    </Column>
  );
}

WelcomeToWalletWithFunds.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.welcomeToWalletWithFunds.buttons.next" />
);
