import React, { useCallback, useMemo } from "react";
import {
  Tile,
  TileContent,
  TileTitle,
  TileDescription,
  Text,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { getChangePercentage } from "@ledgerhq/live-common/market/utils/index";
import { formatTrendPercent, getTrendTone } from "@shared/trend";
import { MarketTileProps } from "../../types";
import MarketTileIcon from "../MarketTileIcon";

const MarketTile = ({ item, index, range, onPress }: MarketTileProps) => {
  const { t } = useTranslation();

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const priceChange = useMemo(() => getChangePercentage(item, range), [item, range]);

  const renderIcon = useCallback(
    () => <MarketTileIcon ledgerIds={item.ledgerIds} ticker={item.ticker} image={item.image} />,
    [item.ledgerIds, item.ticker, item.image],
  );

  const formattedChange = formatTrendPercent(priceChange, { zeroSign: "+" });
  const changeColor = getTrendTone(priceChange) === "negative" ? "error" : "success";

  const accessibilityLabel = t("marketBanner.tile.accessibilityLabel", {
    name: item.name,
    change: formattedChange,
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
      <Spot size={40} icon={renderIcon} />
      <TileContent>
        <TileTitle>{capitalizedTicker}</TileTitle>
        <TileDescription>
          <Text lx={{ color: changeColor }}>{formattedChange}</Text>
        </TileDescription>
      </TileContent>
    </Tile>
  );
};

export default React.memo(MarketTile);
