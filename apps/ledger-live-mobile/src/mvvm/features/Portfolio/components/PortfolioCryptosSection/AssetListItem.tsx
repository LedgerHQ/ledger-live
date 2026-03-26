import React, { useCallback } from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import CurrencyIcon from "~/components/CurrencyIcon";
import { Asset } from "~/types/asset";
import {
  useAssetListItemViewModel,
  type AssetListItemViewModelResult,
} from "./useAssetListItemViewModel";

interface AssetListItemProps {
  asset: Asset;
  onPress: (asset: Asset) => void;
}

interface AssetListItemViewProps extends AssetListItemViewModelResult {
  asset: Asset;
  onPress: () => void;
}

const AssetListItemView: React.FC<AssetListItemViewProps> = ({
  asset,
  onPress,
  formattedBalance,
  formattedCounterValue,
  deltaText,
  deltaColor,
}) => (
  <ListItem
    onPress={onPress}
    testID={`assetItem-${asset.currency.name}`}
    style={{ marginHorizontal: -8 }} // offsets ListItem's internal paddingHorizontal: s8
  >
    <ListItemLeading>
      <CurrencyIcon currency={asset.currency} size={48} />
      <ListItemContent>
        <ListItemTitle>{asset.currency.name}</ListItemTitle>
        <ListItemDescription>{formattedBalance}</ListItemDescription>
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
  </ListItem>
);

const AssetListItem: React.FC<AssetListItemProps> = ({ asset, onPress }) => {
  const vmResult = useAssetListItemViewModel(asset);
  const handlePress = useCallback(() => onPress(asset), [asset, onPress]);

  return <AssetListItemView asset={asset} onPress={handlePress} {...vmResult} />;
};

export default AssetListItem;
