import React from "react";
import { useTranslation } from "~/context/Locale";
import { Box, Pressable, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import MarketInsightDefinitionSheet from "LLM/components/MarketInsightDefinitionSheet";
import type { AltcoinSeasonViewProps } from "./types";
import { AltcoinSeasonArc } from "./AltcoinSeasonArc";

const ALTCOIN_SEASON_CARD_HEIGHT = 68;

function getAltcoinSeasonTranslationKey(value: number) {
  return value < 50 ? "altcoinSeason.levels.bitcoin" : "altcoinSeason.levels.altcoin";
}

export function AltcoinSeasonView({
  data,
  isLoading,
  isError,
  isDrawerOpen,
  handleOpenDrawer,
  handleCloseDrawer,
  width,
}: AltcoinSeasonViewProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Skeleton
        testID="altcoin-season-card-skeleton"
        lx={{ borderRadius: "md" }}
        style={{ width, height: ALTCOIN_SEASON_CARD_HEIGHT }}
      />
    );
  }

  if (!data || isError) return null;

  const { value } = data;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={handleOpenDrawer}
        testID="altcoin-season-card"
        lx={cardStyle}
        style={{ width, height: ALTCOIN_SEASON_CARD_HEIGHT }}
      >
        <Box lx={contentStyle}>
          <Box lx={{ flexShrink: 1 }}>
            <Text typography="body3" numberOfLines={1} lx={{ color: "muted", marginBottom: "s4" }}>
              {t("altcoinSeason.title")}
            </Text>
            <Text typography="body1SemiBold" numberOfLines={1} lx={{ color: "base" }}>
              {t(getAltcoinSeasonTranslationKey(value))}
            </Text>
          </Box>
          <Box lx={{ flexShrink: 0 }}>
            <AltcoinSeasonArc value={value} />
          </Box>
        </Box>
      </Pressable>
      <MarketInsightDefinitionSheet
        title={t("altcoinSeason.definitionTitle")}
        description={t("altcoinSeason.description")}
        disclaimer={t("altcoinSeason.disclaimer")}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </>
  );
}

const cardStyle: LumenViewStyle = {
  backgroundColor: "muted",
  borderRadius: "md",
  padding: "s12",
  justifyContent: "center",
};

const contentStyle: LumenViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "s12",
};
