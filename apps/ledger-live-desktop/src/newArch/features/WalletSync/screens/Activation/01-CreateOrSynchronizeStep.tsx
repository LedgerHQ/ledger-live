import { Icons, Link, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import {
  AnalyticsFlow,
  AnalyticsPage,
  useLedgerSyncAnalytics,
} from "../../hooks/useLedgerSyncAnalytics";
import { LogoWrapper } from "../../components/LogoWrapper";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { openURL } from "~/renderer/linking";
import { LdlsButton } from "LLD/components";

type Props = {
  goToCreateBackup: () => void;
  goToSync: () => void;
  sourcePage: AnalyticsPage;
};

export default function CreateOrSynchronizeStep({ goToCreateBackup, goToSync, sourcePage }: Props) {
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
    <div className="flex flex-col items-center justify-center gap-24">
      <TrackPage category={AnalyticsPage.Activation} source={sourcePage} />

      <div className="flex items-center justify-center">
        <LogoWrapper>
          <Icons.Mobile color={colors.constant.purple} />
        </LogoWrapper>

        <LogoWrapper opacity="100%">
          <Icons.Refresh size="L" color={colors.constant.purple} />
        </LogoWrapper>

        <LogoWrapper>
          <Icons.Desktop color={colors.constant.purple} />
        </LogoWrapper>
      </div>

      <Text fontSize={24} variant="h4Inter" textAlign="center">
        {t("walletSync.activate.title")}
      </Text>
      <Text fontSize={14} variant="body" color="hsla(0, 0%, 58%, 1)" textAlign="center">
        {t("walletSync.activate.description")}
      </Text>
      <div className="flex w-full justify-center">
        <LdlsButton appearance="gray" className="w-full flex-1" onClick={goToCreateBackup}>
          <Text variant="body" color="neutral.c00" fontSize={14} flexShrink={1}>
            {t("walletSync.activate.cta")}
          </Text>
        </LdlsButton>
      </div>

      <div className="flex w-full justify-center">
        <LdlsButton appearance="base" className="w-full flex-1" onClick={goToSync}>
          <Text variant="body" fontSize={14} flexShrink={1}>
            {t("walletSync.activate.alreadySync")}
          </Text>
        </LdlsButton>
      </div>
      {hasLearnMoreLink && (
        <Link onClick={onLearnMore}>
          <Text variant="body" fontSize={14} flexShrink={1}>
            {t("walletSync.activate.learnMore")}
          </Text>
        </Link>
      )}
    </div>
  );
}
