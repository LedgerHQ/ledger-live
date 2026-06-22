import React, { memo, useCallback } from "react";
import {
  Box,
  ListItem as LumenListItem,
  ListItemContent,
  ListItemContentRow,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Tag,
  Text,
  Trend,
} from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import Icon from "@ledgerhq/crypto-icons/native";
import CurrencyIcon from "~/components/CurrencyIcon";
import Delta from "LLM/components/Delta";
import { Asset } from "~/types/asset";
import type { AssetListItemViewModelResult } from "../usePrecomputedAssetListData";
import type { MarketAssetDisplayData } from "../types";

interface PortfolioRowProps {
  asset: Asset;
  onPress: (asset: Asset) => void;
  precomputed: AssetListItemViewModelResult;
  lx?: LumenViewStyle;
  hideNetwork?: boolean;
}

interface MarketRowProps {
  market: MarketAssetDisplayData;
  onPress: (market: MarketAssetDisplayData) => void;
  lx?: LumenViewStyle;
}

type AssetListItemProps =
  | ({ variant?: "portfolio" } & PortfolioRowProps)
  | ({ variant: "market" } & MarketRowProps);

const trailingStyle: LumenViewStyle = {
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "s4",
};

const PortfolioRow = memo(({ asset, onPress, precomputed, lx, hideNetwork }: PortfolioRowProps) => {
  const handlePress = useCallback(() => onPress(asset), [asset, onPress]);
  const { formattedBalance, formattedCounterValue, countervalueChange } = precomputed;

  return (
    <LumenListItem onPress={handlePress} testID={`assetItem-${asset.currency.name}`} lx={lx}>
      <ListItemLeading>
        <CurrencyIcon currency={asset.currency} size={48} hideNetwork={hideNetwork} />
        <ListItemContent style={{ flex: 1, minWidth: 0 }}>
          <ListItemTitle numberOfLines={1}>{asset.currency.name}</ListItemTitle>
          <ListItemDescription numberOfLines={1}>{formattedBalance}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Box lx={trailingStyle}>
          {formattedCounterValue != null && (
            <Text
              typography="body2SemiBold"
              lx={{ color: "base" }}
              testID={`assetItem-${asset.currency.name}-countervalue`}
            >
              {formattedCounterValue}
            </Text>
          )}
          {countervalueChange && (
            <Delta
              valueChange={countervalueChange}
              percent
              show0Delta
              fallbackToPercentPlaceholder
              isArrowDisplayed
            />
          )}
        </Box>
      </ListItemTrailing>
    </LumenListItem>
  );
});
PortfolioRow.displayName = "PortfolioAssetListItem";

const MarketRow = memo(({ market, onPress, lx }: MarketRowProps) => {
  const handlePress = useCallback(() => onPress(market), [market, onPress]);

  return (
    <LumenListItem onPress={handlePress} testID={`marketItem-${market.id}`} lx={lx}>
      <ListItemLeading>
        <Icon ledgerId={market.ledgerIds[0]} ticker={market.ticker} size={48} />
        <ListItemContent style={{ flex: 1, minWidth: 0 }}>
          <ListItemTitle numberOfLines={1}>{market.name}</ListItemTitle>
          <ListItemContentRow>
            <ListItemDescription numberOfLines={1}>{market.formattedMarketCap}</ListItemDescription>
            {market.marketcapRank > 0 && (
              <Tag appearance="gray" size="sm" label={`#${market.marketcapRank}`} />
            )}
          </ListItemContentRow>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Box lx={trailingStyle}>
          <Text
            typography="body2SemiBold"
            lx={{ color: "base" }}
            testID={`marketItem-${market.id}-price`}
          >
            {market.formattedPrice}
          </Text>
          <Trend value={market.priceChangePercentage} size="sm" />
        </Box>
      </ListItemTrailing>
    </LumenListItem>
  );
});
MarketRow.displayName = "MarketAssetListItem";

const AssetListItem: React.FC<AssetListItemProps> = props =>
  props.variant === "market" ? <MarketRow {...props} /> : <PortfolioRow {...props} />;

export default AssetListItem;
