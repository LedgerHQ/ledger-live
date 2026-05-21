import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  IconButton,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";

type Props = Readonly<{
  label: string;
  onPress: () => void;
}>;

export function EarnBannerView({ label, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Card
      type="info"
      onPress={onPress}
      testID={ASSET_DETAIL_TEST_IDS.earnBanner}
      accessibilityLabel={t("assetDetail.balanceDetails.earnBannerAction")}
    >
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>{label}</CardContentTitle>
            <CardContentDescription>
              {t("assetDetail.balanceDetails.earnBannerSubtitle")}
            </CardContentDescription>
          </CardContent>
        </CardLeading>
        <IconButton
          appearance="transparent"
          size="sm"
          icon={ChevronRight}
          accessibilityLabel={t("assetDetail.balanceDetails.earnBannerAction")}
          onPress={onPress}
        />
      </CardHeader>
    </Card>
  );
}
