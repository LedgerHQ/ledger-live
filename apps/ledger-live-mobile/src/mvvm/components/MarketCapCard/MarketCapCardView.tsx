import React from "react";
import { useTranslation } from "~/context/Locale";
import { Box, Pressable, Skeleton, Text, Trend } from "@ledgerhq/lumen-ui-rnative";
import { useTheme, type LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import MarketInsightDefinitionSheet from "LLM/components/MarketInsightDefinitionSheet";
import MarketInsightErrorCard from "LLM/components/MarketInsightErrorCard";
import type { MarketCapCardViewProps } from "./types";

const MARKET_CAP_CARD_HEIGHT = 68;

export function MarketCapCardView({
  value,
  changePercentage,
  isLoading,
  isError,
  isDrawerOpen,
  handleOpenDrawer,
  handleCloseDrawer,
  width,
}: MarketCapCardViewProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <Skeleton
        testID="market-cap-card-skeleton"
        lx={{ borderRadius: "md" }}
        style={{ width, height: MARKET_CAP_CARD_HEIGHT }}
      />
    );
  }

  if (isError) {
    return (
      <MarketInsightErrorCard
        title={t("marketCapCard.title")}
        message={t("marketBanner.connectionFailed")}
        width={width}
        testID="market-cap-card-error"
      />
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={handleOpenDrawer}
        testID="market-cap-card"
        lx={cardStyle}
        style={({ pressed }) => ({
          width,
          height: MARKET_CAP_CARD_HEIGHT,
          backgroundColor: pressed ? theme.colors.bg.mutedPressed : theme.colors.bg.muted,
        })}
      >
        <Text typography="body3" numberOfLines={1} lx={{ color: "muted", marginBottom: "s4" }}>
          {t("marketCapCard.title")}
        </Text>
        <Box lx={valueStyle}>
          <Text typography="body1SemiBold" numberOfLines={1} lx={{ color: "base" }}>
            {value}
          </Text>
          {changePercentage !== undefined ? <Trend value={changePercentage} size="md" /> : null}
        </Box>
      </Pressable>
      <MarketInsightDefinitionSheet
        title={t("marketCapCard.title")}
        description={t("marketCapCard.description")}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </>
  );
}

const cardStyle: LumenViewStyle = {
  borderRadius: "md",
  padding: "s12",
  justifyContent: "center",
};

const valueStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
};
