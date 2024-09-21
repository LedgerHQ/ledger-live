import { Flex, Icons, Link, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import ButtonV3 from "~/renderer/components/ButtonV3";
import TrackPage from "~/renderer/analytics/TrackPage";
import {
  AnalyticsFlow,
  AnalyticsPage,
  useLedgerSyncAnalytics,
} from "../../hooks/useLedgerSyncAnalytics";
import { LogoWrapper } from "../../components/LogoWrapper";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { openURL } from "~/renderer/linking";

type Props = {
  goToCreateBackup: () => void;
  goToSync: () => void;
};

export default function CreateOrSynchronizeStep({ goToCreateBackup, goToSync }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const ledgerSyncFF = useFeature("lldWalletSync");
  const learnMoreUrl = ledgerSyncFF?.params?.learnMoreLink;
  const hasLearnMoreLink = !!learnMoreUrl;

  const { onClickTrack } = useLedgerSyncAnalytics();

  const onLearnMore = () => {
    if (learnMoreUrl) {
      onClickTrack({
        button: "How does Ledger Sync work",
        page: AnalyticsPage.Activation,
        flow: AnalyticsFlow,
      });
      openURL(learnMoreUrl);
    }
  };

  return (
    <Flex flexDirection="column" alignSelf="center" justifyContent="center" rowGap="24px">
      <TrackPage category={AnalyticsPage.Activation} source={AnalyticsPage.SettingsGeneral} />
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
      <Flex justifyContent="center" width="100%">
        <ButtonV3 variant="main" width="100%" onClick={goToCreateBackup}>
          <Text variant="body" color="neutral.c00" fontSize={14} flexShrink={1}>
            {t("walletSync.activate.cta")}
          </Text>
        </ButtonV3>
      </Flex>

      <Flex justifyContent="center" width="100%">
        <ButtonV3 variant="shade" width="100%" onClick={goToSync}>
          <Text variant="body" fontSize={14} flexShrink={1}>
            {t("walletSync.activate.alreadySync")}
          </Text>
        </ButtonV3>
      </Flex>
      {hasLearnMoreLink && (
        <Link onClick={onLearnMore}>
          <Text variant="body" fontSize={14} flexShrink={1}>
            {t("walletSync.activate.learnMore")}
          </Text>
        </Link>
      )}
    </Flex>
  );
}
