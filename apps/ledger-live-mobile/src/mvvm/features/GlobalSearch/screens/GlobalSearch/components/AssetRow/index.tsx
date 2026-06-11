import React, { useCallback } from "react";
import Icon from "@ledgerhq/crypto-icons/native";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Text,
  Trend,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";

type Props = Readonly<{
  market: MarketAssetDisplayData;
  onPress: (market: MarketAssetDisplayData) => void;
  lx?: LumenViewStyle;
}>;

export function AssetRow({ market, onPress, lx }: Props) {
  const handlePress = useCallback(() => onPress(market), [market, onPress]);

  return (
    <ListItem
      density="compact"
      onPress={handlePress}
      testID={`global-search-asset-${market.id}`}
      lx={lx}
    >
      <ListItemLeading>
        <Icon ledgerId={market.ledgerIds[0]} ticker={market.ticker} size={24} />
        <ListItemContent style={{ flex: 1, minWidth: 0 }}>
          <ListItemTitle numberOfLines={1}>{market.name}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Box lx={trailingStyle}>
          <Text
            typography="body2SemiBold"
            lx={{ color: "base" }}
            testID={`global-search-asset-${market.id}-price`}
          >
            {market.formattedPrice}
          </Text>
          <Trend value={market.priceChangePercentage} size="sm" />
        </Box>
      </ListItemTrailing>
    </ListItem>
  );
}

const trailingStyle: LumenViewStyle = { flexDirection: "row", alignItems: "center", gap: "s8" };
