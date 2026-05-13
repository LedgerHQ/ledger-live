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
import Delta from "LLM/components/Delta";
import { Asset } from "~/types/asset";
import type { AssetListItemViewModelResult } from "../usePrecomputedAssetListData";

interface AssetListItemProps {
  asset: Asset;
  onPress: (asset: Asset) => void;
  precomputed: AssetListItemViewModelResult;
  lx?: LumenViewStyle;
  hideNetwork?: boolean;
}

const AssetListItem: React.FC<AssetListItemProps> = memo(
  ({ asset, onPress, precomputed, lx, hideNetwork }) => {
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
          <Box lx={{ flexDirection: "column", alignItems: "flex-end", gap: "s4" }}>
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
                fallbackToPercentPlaceholder
                isArrowDisplayed
              />
            )}
          </Box>
        </ListItemTrailing>
      </LumenListItem>
    );
  },
);
AssetListItem.displayName = "AssetListItem";

export default AssetListItem;
