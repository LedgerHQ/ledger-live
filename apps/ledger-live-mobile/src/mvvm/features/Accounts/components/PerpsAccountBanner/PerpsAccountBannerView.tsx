import React from "react";
import { Banner, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  isVisible: boolean;
  onOpenPerps: () => void;
}>;

export function PerpsAccountBannerView({ isVisible, onOpenPerps }: Props) {
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <Box lx={{ paddingHorizontal: "s16", marginTop: "s24", marginBottom: "s24" }}>
      <Banner
        appearance="info"
        title={t("perpsAccountBanner.title")}
        description={t("perpsAccountBanner.description")}
        primaryAction={
          <Button appearance="gray" size="sm" onPress={onOpenPerps}>
            {t("perpsAccountBanner.cta")}
          </Button>
        }
        testID="perps-account-banner"
      />
    </Box>
  );
}
