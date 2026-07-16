import React from "react";
import { Banner, Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "../../../../testIds";

type Props = Readonly<{
  show: boolean;
}>;

export function StockDisclaimerBanner({ show }: Props) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.stockDisclaimerBanner}>
      <Banner appearance="info" title={t("assetDetail.stockDisclaimerBanner.title")} />
    </Box>
  );
}
