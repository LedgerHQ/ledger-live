import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  onPress: () => void;
}>;

export default function LedgerSyncBannerV4({ onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Banner
      appearance="info"
      title={t("walletSync.banner.title")}
      description={t("walletSync.banner.description")}
      primaryAction={
        <Button appearance="base" size="sm" onPress={onPress}>
          {t("walletSync.banner.cta")}
        </Button>
      }
    />
  );
}
