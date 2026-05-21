import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "../../../../testIds";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = Readonly<{
  show: boolean;
  onShowAsset: () => void;
}>;

export function HiddenAssetBanner({ show, onShowAsset }: Props) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <Banner
      testID={ASSET_DETAIL_TEST_IDS.hiddenAssetBanner}
      lx={bannerStyle}
      appearance="info"
      title={t("assetDetail.hiddenAssetBanner.title")}
      accessibilityLabel={t("assetDetail.hiddenAssetBanner.title")}
      primaryAction={
        <Button
          appearance="gray"
          size="sm"
          onPress={onShowAsset}
          testID={ASSET_DETAIL_TEST_IDS.hiddenAssetBannerShowAsset}
        >
          {t("assetDetail.hiddenAssetBanner.showAsset")}
        </Button>
      }
    />
  );
}

const bannerStyle: LumenViewStyle = {
  marginBottom: "-s16",
};
