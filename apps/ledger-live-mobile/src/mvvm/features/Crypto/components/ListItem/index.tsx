import React, { useCallback } from "react";
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
import { useListItemViewModel, type ListItemViewModelResult } from "./useListItemViewModel";

interface ListItemProps {
  asset: Asset;
  onPress: (asset: Asset) => void;
}

interface ListItemViewProps extends ListItemViewModelResult {
  asset: Asset;
  onPress: () => void;
}

const ListItemView: React.FC<ListItemViewProps> = ({
  asset,
  onPress,
  formattedBalance,
  formattedCounterValue,
  deltaText,
  deltaColor,
}) => (
  <LumenListItem onPress={onPress} testID={`assetItem-${asset.currency.name}`}>
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

const ListItem: React.FC<ListItemProps> = ({ asset, onPress }) => {
  const vmResult = useListItemViewModel(asset);
  const handlePress = useCallback(() => onPress(asset), [asset, onPress]);

  return <ListItemView asset={asset} onPress={handlePress} {...vmResult} />;
};

export default ListItem;
