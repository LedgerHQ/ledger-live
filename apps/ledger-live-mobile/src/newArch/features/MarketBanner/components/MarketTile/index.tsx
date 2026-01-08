import React, { useCallback, useMemo } from "react";
import { Tile, TileContent, TileTitle, TileDescription } from "@ledgerhq/lumen-ui-rnative";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { MarketTileProps } from "../../types";
import { getChangePercentage } from "../../utils";
import MarketTileIcon from "../MarketTileIcon";

const MarketTile = ({ item, index, range, onPress }: MarketTileProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const priceChange = useMemo(() => getChangePercentage(item, range), [item, range]);

  const isPositive = priceChange >= 0;
  const changeColor = isPositive ? colors.success.c50 : colors.error.c50;
  const changeSign = isPositive ? "+" : "";

  const accessibilityLabel = t("marketBanner.tile.accessibilityLabel", {
    name: item.name,
    change: `${changeSign}${priceChange.toFixed(2)}%`,
  });

  return (
    <Tile
      appearance="card"
      onPress={handlePress}
      lx={{ width: "s96", flexShrink: 0, marginRight: "s8" }}
      testID={`market-banner-tile-${index}`}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t("marketBanner.tile.accessibilityHint")}
      accessibilityRole="button"
    >
      <MarketTileIcon imageUrl={item.image} name={item.name} />
      <TileContent>
        <TileTitle>{item.name}</TileTitle>
        <TileDescription>
          <Text color={changeColor}>
            {changeSign}
            {priceChange.toFixed(2)}%
          </Text>
        </TileDescription>
      </TileContent>
    </Tile>
  );
};

export default React.memo(MarketTile);
