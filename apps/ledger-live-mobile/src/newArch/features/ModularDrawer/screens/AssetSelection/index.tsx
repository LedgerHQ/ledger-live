import React, { useCallback, useRef } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  ApyIndicator,
  AssetItem,
  AssetType,
  MarketPriceIndicator,
  MarketPercentIndicator,
} from "@ledgerhq/native-ui/pre-ldls/index";
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
import { GenericError } from "../../components/GenericError";
import { useNetInfo } from "@react-native-community/netinfo";
import { InfiniteLoader } from "@ledgerhq/native-ui";
import createAssetConfigurationHook from "@ledgerhq/live-common/modularDrawer/modules/createAssetConfiguration";
import { balanceItem } from "../../components/Balance";
import { useBalanceDeps } from "../../hooks/useBalanceDeps";
import { useSelector } from "react-redux";
import { modularDrawerFlowSelector, modularDrawerSourceSelector } from "~/reducers/modularDrawer";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";

export type AssetSelectionStepProps = {
  isOpen: boolean;
  availableAssets: CryptoOrTokenCurrency[];
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  isLoading?: boolean;
  hasError?: boolean;
  refetch?: () => void;
  loadNext?: () => void;
  assetsSorted?: AssetData[];
};

const SAFE_MARGIN_BOTTOM = 48;

const AssetSelection = ({
  availableAssets,
  onAssetSelected,
  assetsConfiguration,
  isOpen,
  isLoading,
  hasError,
  refetch,
  loadNext,
  assetsSorted,
}: Readonly<AssetSelectionStepProps>) => {
  const { isConnected } = useNetInfo();

  const flow = useSelector(modularDrawerFlowSelector);
  const source = useSelector(modularDrawerSourceSelector);

  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();
  const { collapse } = useBottomSheet();
  const listRef = useRef<FlatList>(null);

  const assetsMap = new Map<
    string,
    { mainCurrency: CryptoOrTokenCurrency; currencies: CryptoOrTokenCurrency[] }
  >();

  assetsSorted?.forEach(({ asset: { id: providerId }, networks = [] }) => {
    if (networks.length > 0) {
      const mainCurrency = networks.find(c => c.id === providerId) ?? networks[0];
      assetsMap.set(providerId, {
        mainCurrency,
        currencies: networks,
      });
    }
  });

  const assetConfigurationDeps = {
    ApyIndicator,
    MarketPriceIndicator,
    MarketPercentIndicator,
    useBalanceDeps,
    balanceItem,
    assetsMap,
  };

  const makeAssetConfigurationHook = createAssetConfigurationHook(assetConfigurationDeps);

  const transformAssets = makeAssetConfigurationHook({
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
    if (isLoading) return <SkeletonList />;

    if (hasError || !isConnected) {
      return <GenericError onClick={refetch} type={!isConnected ? "internet" : "backend"} />;
    }

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
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<AssetsEmptyList />}
        contentContainerStyle={{
          paddingBottom: SAFE_MARGIN_BOTTOM,
          marginTop: 16,
        }}
        onEndReached={loadNext}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadNext ? <InfiniteLoader size={20} /> : null}
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
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
        onPressIn={handleSearchPressIn}
      />
      {renderContent()}
    </>
  );
};

export default React.memo(AssetSelection);
