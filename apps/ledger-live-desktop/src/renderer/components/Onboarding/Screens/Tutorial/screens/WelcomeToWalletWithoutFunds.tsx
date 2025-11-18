import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, Column, SubTitle } from "../shared";
import { Flex, Icons } from "@ledgerhq/react-ui/index";
import TrackPage from "~/renderer/analytics/TrackPage";

export function WelcomeToWalletWithoutFunds() {
  const { t } = useTranslation();

  return (
    <Column>
      <TrackPage category="Set up device" name="End of onboarding" receiveFlowEnded={false} />
      <Title>{t("onboarding.screens.tutorial.screens.welcomeToWalletWithoutFunds.title")}</Title>
      <SubTitle>
        {t("onboarding.screens.tutorial.screens.welcomeToWalletWithoutFunds.description")}
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

WelcomeToWalletWithoutFunds.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.welcomeToWalletWithoutFunds.buttons.next" />
);
