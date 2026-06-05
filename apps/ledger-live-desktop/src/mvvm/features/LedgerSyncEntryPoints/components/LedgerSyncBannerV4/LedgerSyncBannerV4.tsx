import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { WarningFill } from "@ledgerhq/lumen-ui-react/symbols";

export function LedgerSyncBannerV4({ onPress }: Readonly<{ onPress: () => void }>) {
  const { t } = useTranslation();

  return (
    <ContentBanner>
      <Spot appearance="icon" icon={WarningFill} size={48} />
      <ContentBannerContent>
        <ContentBannerTitle>{t("walletSync.banner.title")}</ContentBannerTitle>
        <ContentBannerDescription>{t("walletSync.banner.description")}</ContentBannerDescription>
      </ContentBannerContent>
      <Button appearance="gray" size="sm" onClick={onPress}>
        {t("walletSync.banner.cta")}
      </Button>
    </ContentBanner>
  );
}
