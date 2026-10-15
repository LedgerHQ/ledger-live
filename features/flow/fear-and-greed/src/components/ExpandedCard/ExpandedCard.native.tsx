import React, { memo } from "react";
import { Box, Pressable, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme, type LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { FearAndGreedIndex } from "@domain/entity-market-index-fear-and-greed";
import { useTranslation } from "@shared/i18n";
import { getFearAndGreedTranslationKey } from "../../utils/fearAndGreed";
import { Indicator } from "../Indicator";
import type { GaugeComponent } from "../../types";
import { EXPANDED_CARD_HEIGHT } from "./constants";

type ExpandedCardProps = Readonly<{
  data: FearAndGreedIndex;
  Gauge: GaugeComponent;
  width?: number;
  onPress?: () => void;
}>;

function ExpandedCardComponent({ data, Gauge, width, onPress }: ExpandedCardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { value } = data;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID="fear-and-greed-card"
      lx={cardStyle}
      style={({ pressed }) => ({
        width,
        height: EXPANDED_CARD_HEIGHT,
        backgroundColor: pressed ? theme.colors.bg.mutedPressed : theme.colors.bg.muted,
      })}
    >
      <Box lx={contentStyle}>
        <Box lx={{ flexShrink: 1 }}>
          <Text typography="body3" numberOfLines={1} lx={{ color: "muted", marginBottom: "s4" }}>
            {t("fearAndGreed.title")}
          </Text>
          <Text typography="body1SemiBold" numberOfLines={1} lx={{ color: "base" }}>
            {t(getFearAndGreedTranslationKey(value))}
          </Text>
        </Box>
        <Box lx={{ flexShrink: 0 }}>
          <Indicator value={value} Gauge={Gauge} />
        </Box>
      </Box>
    </Pressable>
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

export const ExpandedCard = memo(ExpandedCardComponent);
