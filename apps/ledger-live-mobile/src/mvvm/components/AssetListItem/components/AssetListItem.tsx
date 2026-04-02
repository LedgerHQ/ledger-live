import React, { useCallback } from "react";
import { ViewStyle } from "react-native";
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
import CurrencyIcon from "~/components/CurrencyIcon";
import { Asset } from "~/types/asset";
import {
  useAssetListItemViewModel,
  type AssetListItemViewModelResult,
} from "../useAssetListItemViewModel";

interface AssetListItemProps {
  asset: Asset;
  onPress: (asset: Asset) => void;
  style?: ViewStyle;
}

interface AssetListItemViewProps extends AssetListItemViewModelResult {
  asset: Asset;
  onPress: () => void;
  style?: ViewStyle;
}

const AssetListItemView: React.FC<AssetListItemViewProps> = ({
  asset,
  onPress,
  style,
  formattedBalance,
  formattedCounterValue,
  deltaText,
  deltaColor,
}) => (
  <LumenListItem onPress={onPress} testID={`assetItem-${asset.currency.name}`} style={style}>
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

const AssetListItem: React.FC<AssetListItemProps> = ({ asset, onPress, style }) => {
  const vmResult = useAssetListItemViewModel(asset);
  const handlePress = useCallback(() => onPress(asset), [asset, onPress]);

  return <AssetListItemView asset={asset} onPress={handlePress} style={style} {...vmResult} />;
};

export default AssetListItem;
