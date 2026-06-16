import React, { memo } from "react";
import { Box, Pressable, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme, type LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { getFearAndGreedTranslationKey } from "@ledgerhq/live-common/cmc-client/utils/fearAndGreed";
import { useTranslation } from "~/context/Locale";
import FearAndGreedArc from "../FearAndGreedArc";
import type { FearAndGreedExpandedCardProps, FearAndGreedExpandedCardSkeletonProps } from "./types";

export const FEAR_AND_GREED_CARD_HEIGHT = 68;

function FearAndGreedExpandedCard({ data, width, onPress }: FearAndGreedExpandedCardProps) {
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
        height: FEAR_AND_GREED_CARD_HEIGHT,
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
          <FearAndGreedArc value={value} />
        </Box>
      </Box>
    </Pressable>
  );
}

export function FearAndGreedExpandedCardSkeleton({
  width,
  testID,
}: FearAndGreedExpandedCardSkeletonProps) {
  return (
    <Skeleton
      testID={testID}
      lx={skeletonStyle}
      style={{ width, height: FEAR_AND_GREED_CARD_HEIGHT }}
    />
  );
}

const cardStyle: LumenViewStyle = {
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

const skeletonStyle: LumenViewStyle = {
  borderRadius: "md",
};

export default memo(FearAndGreedExpandedCard);
