import React, { useCallback, useEffect, useRef } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetItem, AssetType } from "@ledgerhq/native-ui/pre-ldls/index";
import SearchInputContainer from "./components/SearchInputContainer";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
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

export type AssetSelectionStepProps = {
  isOpen: boolean;
  availableAssets: CryptoOrTokenCurrency[];
  defaultSearchValue: string;
  setDefaultSearchValue: (value: string) => void;
  itemsToDisplay: CryptoOrTokenCurrency[];
  setItemsToDisplay: (items: CryptoOrTokenCurrency[]) => void;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  flow: string;
  source: string;
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
};

const SAFE_MARGIN_BOTTOM = 48;

const AssetSelection = ({
  availableAssets,
  defaultSearchValue,
  setDefaultSearchValue,
  itemsToDisplay,
  setItemsToDisplay,
  onAssetSelected,
  flow,
  source,
  assetsConfiguration,
}: Readonly<AssetSelectionStepProps>) => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();
  const { collapse } = useBottomSheet();
  const listRef = useRef<FlatList>(null);

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

  useEffect(() => {
    if (defaultSearchValue === undefined) {
      return;
    }

    if (availableAssets.length > 0) {
      setItemsToDisplay(
        availableAssets.filter(asset =>
          asset.name.toLowerCase().includes(defaultSearchValue.toLowerCase()),
        ),
      );
    }
  }, [defaultSearchValue, availableAssets, setItemsToDisplay]);

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

  return (
    <>
      <TrackDrawerScreen
        page={EVENTS_NAME.MODULAR_ASSET_SELECTION}
        flow={flow}
        source={source}
        assetsConfig={assetsConfiguration}
        formatAssetConfig
      />
      <SearchInputContainer
        source="modular-drawer"
        flow="asset-selection"
        items={availableAssets}
        setItemsToDisplay={setItemsToDisplay}
        assetsToDisplay={itemsToDisplay}
        originalAssets={availableAssets}
        setSearchedValue={setDefaultSearchValue}
        defaultValue={defaultSearchValue}
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
        onPressIn={handleSearchPressIn}
      />
      <BottomSheetVirtualizedList
        ref={listRef}
        scrollToOverflowEnabled={true}
        data={itemsToDisplay}
        keyExtractor={item => item.id}
        getItemCount={itemsToDisplay => itemsToDisplay.length}
        getItem={(itemsToDisplay, index) => itemsToDisplay[index]}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<AssetsEmptyList />}
        contentContainerStyle={{
          paddingBottom: SAFE_MARGIN_BOTTOM,
          marginTop: 16,
        }}
      />
    </>
  );
};

export default React.memo(AssetSelection);
