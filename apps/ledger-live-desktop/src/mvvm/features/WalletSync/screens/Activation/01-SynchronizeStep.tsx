import { Flex, Icons, Text } from "@ledgerhq/react-ui";
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
  sourcePage: AnalyticsPage;
};

export default function SynchronizeStep({
  goToCreateBackup,
  goToSync: _goToSync,
  sourcePage,
}: Readonly<Props>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const ledgerSyncFF = useFeature("lldWalletSync");
  const learnMoreUrl = ledgerSyncFF?.params?.learnMoreLink;

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
    <Flex flexDirection="column" width="100%" height="90%" justifyContent="space-between">
      <TrackPage category={AnalyticsPage.Activation} source={sourcePage} />
      <Flex
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        flex={1}
        rowGap="24px"
      >
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
          {t("walletSync.activate.titleModal")}
        </Text>
        <Text fontSize={14} variant="body" color="neutral.c70" textAlign="center">
          {t("walletSync.activate.descriptionModal")}
          <Text fontSize={14} variant="body" color={colors.primary.c80} onClick={onLearnMore}>
            {" "}
            {t("common.learnMore")}
          </Text>
        </Text>
      </Flex>
      <Flex justifyContent="center" width="100%">
        <ButtonV3 variant="main" width="100%" onClick={goToCreateBackup}>
          <Text variant="body" color="neutral.c00" fontSize={14} flexShrink={1}>
            {t("walletSync.activate.ctaModal")}
          </Text>
        </ButtonV3>
      </Flex>
    </Flex>
  );
}
