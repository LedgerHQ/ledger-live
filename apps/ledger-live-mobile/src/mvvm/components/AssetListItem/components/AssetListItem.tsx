import React, { memo, useCallback } from "react";
import {
  Box,
  ListItem as LumenListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import CurrencyIcon from "~/components/CurrencyIcon";
import { Asset } from "~/types/asset";
import type { AssetListItemViewModelResult } from "../usePrecomputedAssetListData";

interface AssetListItemProps {
  asset: Asset;
  onPress: (asset: Asset) => void;
  precomputed: AssetListItemViewModelResult;
  lx?: LumenViewStyle;
}

const AssetListItem: React.FC<AssetListItemProps> = memo(({ asset, onPress, precomputed, lx }) => {
  const handlePress = useCallback(() => onPress(asset), [asset, onPress]);
  const { formattedBalance, formattedCounterValue, deltaText, deltaColor } = precomputed;

  return (
    <LumenListItem onPress={handlePress} testID={`assetItem-${asset.currency.name}`} lx={lx}>
      <ListItemLeading>
        <CurrencyIcon currency={asset.currency} size={48} />
        <ListItemContent style={{ flex: 1, minWidth: 0 }}>
          <ListItemTitle numberOfLines={1}>{asset.currency.name}</ListItemTitle>
          <ListItemDescription numberOfLines={1}>{formattedBalance}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Box lx={{ flexDirection: "column", alignItems: "flex-end", gap: "s4" }}>
          {formattedCounterValue != null && (
            <Text typography="body2SemiBold" lx={{ color: "base" }}>
              {formattedCounterValue}
            </Text>
          )}
          <Text typography="body3" lx={{ color: deltaColor }}>
            {deltaText}
          </Text>
        </Box>
      </ListItemTrailing>
    </LumenListItem>
  );
});
AssetListItem.displayName = "AssetListItem";

export default AssetListItem;
