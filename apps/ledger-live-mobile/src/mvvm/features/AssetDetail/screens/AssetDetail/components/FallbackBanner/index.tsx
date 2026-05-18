import React from "react";
import { Banner, Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "../../../../testIds";

type Props = Readonly<{
  show: boolean;
}>;

export function FallbackBanner({ show }: Props) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.fallbackBanner}>
      <Banner appearance="info" title={t("assetDetail.fallbackBanner.title")} />
    </Box>
  );
}
