import React, { useCallback, useRef } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetItem, AssetType } from "@ledgerhq/native-ui/pre-ldls/index";
import SearchInputContainer from "./components/SearchInputContainer";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import SkeletonList from "../../components/Skeleton/SkeletonList";
import {
  useModularDrawerAnalytics,
  TrackDrawerScreen,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
} from "../../analytics";
import { FlatList } from "react-native";
import {
  BottomSheetVirtualizedList,
  useBottomSheetInternal,
  useBottomSheet,
} from "@gorhom/bottom-sheet";
import { AssetsEmptyList } from "LLM/components/EmptyList/AssetsEmptyList";
import createAssetConfigurationHook from "./modules/createAssetConfigurationHook";
import { GenericError } from "../../components/GenericError";
import { useNetInfo } from "@react-native-community/netinfo";
import { InfiniteLoader } from "@ledgerhq/native-ui";

export type AssetSelectionStepProps = {
  isOpen: boolean;
  availableAssets: CryptoOrTokenCurrency[];
  defaultSearchValue: string;
  setDefaultSearchValue: (value: string) => void;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  flow: string;
  source: string;
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  isLoading?: boolean;
  hasError?: boolean;
  refetch?: () => void;
  loadNext?: () => void;
};

const SAFE_MARGIN_BOTTOM = 48;

const AssetSelection = ({
  availableAssets,
  defaultSearchValue,
  setDefaultSearchValue,
  onAssetSelected,
  flow,
  source,
  assetsConfiguration,
  isOpen,
  isLoading,
  hasError,
  refetch,
  loadNext,
}: Readonly<AssetSelectionStepProps>) => {
  const { isConnected } = useNetInfo();

  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();
  const { collapse } = useBottomSheet();
  const listRef = useRef<FlatList>(null);

  const transformAssets = createAssetConfigurationHook({
    assetsConfiguration,
  });
  const formattedAssets = transformAssets(availableAssets);

  const handleAssetClick = useCallback(
    (asset: AssetType) => {
      const originalAsset = availableAssets.find(a => a.id === asset.id);
      if (originalAsset) {
        collapse();
        trackModularDrawerEvent(
          EVENTS_NAME.ASSET_CLICKED,
          {
            flow,
            source,
            asset: originalAsset.name,
            page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
          },
          {
            formatAssetConfig: !!assetsConfiguration,
            assetsConfig: assetsConfiguration,
          },
        );
        onAssetSelected(originalAsset);
      }
    },
    [
      availableAssets,
      onAssetSelected,
      collapse,
      assetsConfiguration,
      flow,
      source,
      trackModularDrawerEvent,
    ],
  );

  const handleSearchPressIn = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleSearchFocus = () => {
    shouldHandleKeyboardEvents.value = true;
  };

  const handleSearchBlur = () => {
    shouldHandleKeyboardEvents.value = false;
  };

  const renderItem = useCallback(
    ({ item }: { item: AssetType }) => <AssetItem {...item} onClick={handleAssetClick} />,
    [handleAssetClick],
  );

  const renderContent = () => {
    if (hasError || !isConnected) {
      return <GenericError onClick={refetch} type={!isConnected ? "internet" : "backend"} />;
    }
    if (isLoading) return <SkeletonList />;

    return (
      <BottomSheetVirtualizedList
        ref={listRef}
        scrollToOverflowEnabled
        data={formattedAssets}
        keyExtractor={item => item.id}
        getItemCount={items => items.length}
        getItem={(items, index) => items[index]}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<AssetsEmptyList />}
        contentContainerStyle={{
          paddingBottom: SAFE_MARGIN_BOTTOM,
          marginTop: 16,
        }}
        onEndReached={loadNext}
        onEndReachedThreshold={0.5}
        ListFooterComponent={<InfiniteLoader size={20} />}
      />
    );
  };

  return (
    <>
      {isOpen && (
        <TrackDrawerScreen
          page={EVENTS_NAME.MODULAR_ASSET_SELECTION}
          flow={flow}
          source={source}
          assetsConfig={assetsConfiguration}
          formatAssetConfig
        />
      )}
      <SearchInputContainer
        source={source}
        flow={flow}
        setSearchedValue={setDefaultSearchValue}
        defaultValue={defaultSearchValue}
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
        onPressIn={handleSearchPressIn}
      />
      {renderContent()}
    </>
  );
};

export default React.memo(AssetSelection);
