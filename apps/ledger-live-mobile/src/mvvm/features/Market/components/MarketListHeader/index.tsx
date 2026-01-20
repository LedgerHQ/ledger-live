import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

export function MarketListHeaderLeft() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { shouldDisplayMarketBanner } = useWalletFeaturesConfig("mobile");

  const handlePress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (!shouldDisplayMarketBanner) {
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
  const { shouldDisplayMarketBanner } = useWalletFeaturesConfig("mobile");

  if (!shouldDisplayMarketBanner) {
    return null;
  }

  return (
    <Text typography="heading3SemiBold" lx={{ color: "base" }}>
      {t("market.title")}
    </Text>
  );
}
