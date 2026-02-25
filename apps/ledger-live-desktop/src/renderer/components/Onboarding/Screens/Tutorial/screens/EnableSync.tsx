import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Flex, Icons } from "@ledgerhq/react-ui/index";
import { useTheme } from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import { LogoWrapper } from "LLD/features/WalletSync/components/LogoWrapper";
import { Title, Column, SubTitle, TrackTutorialProps } from "../shared";

export function EnableSync(trackProps: Readonly<TrackTutorialProps>) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Column>
      <TrackPage
        category="Set up device"
        name="Ledger Sync"
        flow={trackProps.flow}
        deviceModelId={trackProps.deviceModelId}
        seedConfiguration={trackProps.seedConfiguration}
      />
      <Title>{t("onboarding.screens.tutorial.screens.enableSync.title")}</Title>
      <SubTitle>{t("onboarding.screens.tutorial.screens.enableSync.description")}</SubTitle>
      <Flex flex={1} justifyContent="center" mt="150px">
        <Flex justifyContent="center" alignItems="center">
          <LogoWrapper>
            <Icons.Mobile color={colors.constant.purple} />
          </LogoWrapper>

          <LogoWrapper opacity="100%">
            <Icons.Refresh size="L" color={colors.constant.purple} />
          </LogoWrapper>

          <LogoWrapper>
            <Icons.Desktop color={colors.constant.purple} />
          </LogoWrapper>
        </Flex>
      </Flex>
    </Column>
  );
}

EnableSync.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.enableSync.buttons.next" />
);

EnableSync.continueLabelSecondary = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.enableSync.buttons.nextSecondary" />
);
