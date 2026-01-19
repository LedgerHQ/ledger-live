import React, { useCallback, useMemo } from "react";
import { Tile, TileContent, TileTitle, TileDescription, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "react-i18next";
import { getChangePercentage } from "@ledgerhq/live-common/market/utils/index";
import { MarketTileProps } from "../../types";
import MarketTileIcon from "../MarketTileIcon";

const MarketTile = ({ item, index, range, onPress }: MarketTileProps) => {
  const { t } = useTranslation();

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const priceChange = useMemo(() => getChangePercentage(item, range), [item, range]);

  const isPositive = priceChange >= 0;
  const changeSign = isPositive ? "+" : "";

  const accessibilityLabel = t("marketBanner.tile.accessibilityLabel", {
    name: item.name,
    change: `${changeSign}${priceChange.toFixed(2)}%`,
  });

  const capitalizedTicker = item.ticker.toUpperCase();

  return (
    <Tile
      appearance="card"
      onPress={handlePress}
      lx={{ width: "s96", flexGrow: 1, marginRight: "s8" }}
      testID={`market-banner-tile-${index}`}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t("marketBanner.tile.accessibilityHint")}
      accessibilityRole="button"
    >
      <MarketTileIcon imageUrl={item.image} name={item.name} />
      <TileContent>
        <TileTitle>{capitalizedTicker}</TileTitle>
        <TileDescription>
          <Text lx={{ color: isPositive ? "success" : "error" }}>
            {changeSign}
            {priceChange.toFixed(2)}%
          </Text>
        </TileDescription>
      </TileContent>
    </Tile>
  );
};

export default React.memo(MarketTile);
