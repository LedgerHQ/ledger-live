import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  IconButton,
  Pressable,
} from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";

type Props = Readonly<{
  label: string;
  onPress: () => void;
}>;

export function EarnBannerView({ label, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} testID={ASSET_DETAIL_TEST_IDS.earnBanner}>
      <Card type="info">
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
            icon={Plus}
            accessibilityLabel={t("assetDetail.balanceDetails.earnBannerAction")}
            onPress={onPress}
          />
        </CardHeader>
      </Card>
    </Pressable>
  );
}
