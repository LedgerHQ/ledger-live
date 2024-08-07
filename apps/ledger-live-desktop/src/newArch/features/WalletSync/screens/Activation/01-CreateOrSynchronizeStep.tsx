import { Flex, Icons, Link, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import ButtonV3 from "~/renderer/components/ButtonV3";
import TrackPage from "~/renderer/analytics/TrackPage";
import { AnalyticsPage } from "../../hooks/useWalletSyncAnalytics";
import { LogoWrapper } from "../../components/LogoWrapper";

type Props = {
  goToCreateBackup: () => void;
  goToSync: () => void;
};

export default function CreateOrSynchronizeStep({ goToCreateBackup, goToSync }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" alignSelf="center" justifyContent="center" rowGap="24px">
      <TrackPage category={AnalyticsPage.Activation} />
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

      <Text fontSize={24} variant="h4Inter" textAlign="center">
        {t("walletSync.activate.title")}
      </Text>
      <Text fontSize={14} variant="body" color="hsla(0, 0%, 58%, 1)" textAlign="center">
        {t("walletSync.activate.description")}
      </Text>
      <Flex justifyContent="center">
        <ButtonV3 variant="main" onClick={goToCreateBackup}>
          {t("walletSync.activate.cta")}
        </ButtonV3>
      </Flex>

      <Link onClick={goToSync} alignItems="center" justifyContent="center">
        <Text variant="body" fontSize={14} flexShrink={1}>
          {t("walletSync.alreadySync")}
        </Text>
      </Link>
    </Flex>
  );
}
