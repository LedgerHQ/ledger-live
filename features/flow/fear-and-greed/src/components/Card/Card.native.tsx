import React, { memo } from "react";
import { Box, Tile, TileContent, TileDescription, TileTitle } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import type { FearAndGreedIndex } from "@domain/entity-market-index-fear-and-greed";
import { useTranslation } from "@shared/i18n";
import { getFearAndGreedColorKey, getFearAndGreedTranslationKey } from "../../utils/fearAndGreed";
import { Indicator } from "../Indicator";
import type { GaugeComponent } from "../../types";

type CardProps = Readonly<{
  data: FearAndGreedIndex;
  Gauge: GaugeComponent;
  onPress: () => void;
}>;

function CardComponent({ data, Gauge, onPress }: CardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { value } = data;
  const colorKey = getFearAndGreedColorKey(value);
  const translationKey = getFearAndGreedTranslationKey(value);

  return (
    <Tile
      appearance="card"
      lx={{ width: "s96", flexGrow: 1 }}
      onPress={onPress}
      testID="fear-and-greed-card"
    >
      <Box lx={{ height: "s40", justifyContent: "center", alignItems: "center" }}>
        <Indicator value={value} Gauge={Gauge} />
      </Box>
      <TileContent>
        <TileTitle>{t("fearAndGreed.tileTitle")}</TileTitle>
        <TileDescription style={{ color: theme.colors.text[colorKey] }}>
          {t(translationKey)}
        </TileDescription>
      </TileContent>
    </Tile>
  );
}

export const Card = memo(CardComponent);
