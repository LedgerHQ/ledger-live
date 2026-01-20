import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useIsMarketBannerEnabled } from "LLM/features/MarketBanner/hooks/useIsMarketBannerEnabled";

export function MarketListHeaderLeft() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const isMarketBannerEnabled = useIsMarketBannerEnabled();

  const handlePress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (!isMarketBannerEnabled) {
    return null;
  }

  return (
    <IconButton
      appearance="no-background"
      size="md"
      icon={ArrowLeft}
      accessibilityLabel={t("common.back")}
      onPress={handlePress}
    />
  );
}

export function MarketListHeaderTitle() {
  const { t } = useTranslation();
  const isMarketBannerEnabled = useIsMarketBannerEnabled();

  if (!isMarketBannerEnabled) {
    return null;
  }

  return (
    <Text typography="heading3SemiBold" lx={{ color: "base" }}>
      {t("market.title")}
    </Text>
  );
}
