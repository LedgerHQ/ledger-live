import React, { useCallback, useMemo } from "react";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import useAssetsListViewModel, { type Props } from "./useAssetsListViewModel";
import { Flex } from "@ledgerhq/native-ui";
import { Pressable } from "react-native";
import AssetItem from "./components/AssetItem";
import { Asset } from "~/types/asset";
import BigNumber from "bignumber.js";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";

const ESTIMED_ITEM_SIZE = 150;

type ViewProps = ReturnType<typeof useAssetsListViewModel>;

const View: React.FC<ViewProps> = ({ assetsToDisplay, onItemPress, isSyncEnabled }) => {
  const List = useMemo(() => {
    return isSyncEnabled ? globalSyncRefreshControl<FlashListProps<Asset>>(FlashList) : FlashList;
  }, [isSyncEnabled]);

  const renderItem = useCallback(
    ({ item }: { item: Asset }) => {
      return (
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [
            { opacity: pressed ? 0.5 : 1.0, marginVertical: 12 },
          ]}
          hitSlop={6}
          onPress={onItemPress.bind(null, item)}
        >
          <Flex height={40} flexDirection="row" columnGap={12}>
            <AssetItem asset={item} balance={BigNumber(item.amount)} />
          </Flex>
        </Pressable>
      );
    },
    [onItemPress],
  );

  return (
    <List
      testID="AssetsList"
      estimatedItemSize={ESTIMED_ITEM_SIZE}
      renderItem={renderItem}
      data={assetsToDisplay}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    />
  );
};

const AssetsListView: React.FC<Props> = props => {
  const viewModel = useAssetsListViewModel(props);
  return <View {...viewModel} />;
};

export default AssetsListView;
