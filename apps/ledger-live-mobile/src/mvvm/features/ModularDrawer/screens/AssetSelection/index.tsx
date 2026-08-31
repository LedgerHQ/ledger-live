import React, { useCallback, useMemo, useRef } from "react";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { AssetRow, AssetRowData } from "./components/AssetRow";
import { MarketPriceIndicator } from "../../components/MarketPriceIndicator";
import { MarketPercentIndicator } from "../../components/MarketPercentIndicator";
import { ApyIndicator } from "../../components/ApyIndicator";
import SearchInputContainer from "./components/SearchInputContainer";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import SkeletonList from "../../components/SkeletonList";
import {
  useModularDrawerAnalytics,
  TrackDrawerScreen,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
} from "../../analytics";
import { FlatList } from "react-native";
import {
  BottomSheetVirtualizedList,
  BottomSheetHeader,
  useBottomSheet,
} from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { AssetsEmptyList } from "LLM/components/EmptyList/AssetsEmptyList";
import { GenericError } from "../../components/GenericError";
import { useNetInfo } from "@react-native-community/netinfo";
import InfiniteLoader from "~/components/InfiniteLoader";
import { useAssetConfiguration } from "@ledgerhq/live-common/modularDrawer/modules/createAssetConfiguration";
import { balanceItem } from "../../components/Balance";
import { useBalanceDeps } from "../../hooks/useBalanceDeps";
import { useSelector } from "~/context/hooks";
import { modularDrawerFlowSelector, modularDrawerSourceSelector } from "~/reducers/modularDrawer";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { groupCurrenciesByAsset } from "@ledgerhq/live-common/modularDrawer/utils/groupCurrenciesByAsset";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import {
  getPerpsUiUseCase,
  PERPS_UI_USE_CASE,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import type { DisabledItemExplanation, DisabledItemsExplanation } from "../../types";

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
  uiUseCase?: string;
  selectableNetworkIds?: readonly string[];
  disabledAssetExplanation?: DisabledItemsExplanation["asset"];
  onDisabledAssetPress?: (explanation: DisabledItemExplanation) => void;
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
  uiUseCase,
  selectableNetworkIds,
  disabledAssetExplanation,
  onDisabledAssetPress,
}: Readonly<AssetSelectionStepProps>) => {
  const { t } = useTranslation();
  const { isInternetReachable } = useNetInfo();

  const isPerpsFund = getPerpsUiUseCase(uiUseCase) === PERPS_UI_USE_CASE.fund;

  const headerTitle = isPerpsFund
    ? t("modularDrawer.selectDepositCurrencyTitle")
    : t("modularDrawer.selectAsset");

  const headerDescription = isPerpsFund
    ? t("modularDrawer.selectDepositCurrencyDescription")
    : undefined;

  const flow = useSelector(modularDrawerFlowSelector);
  const source = useSelector(modularDrawerSourceSelector);

  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const { collapse, expand } = useBottomSheet();
  const listRef = useRef<FlatList>(null);

  const expandToFullHeight = () => {
    if (formattedAssets.length > 0) {
      expand();
      listRef.current?.scrollToIndex({ index: 0 });
    }
  };

  const assetsMap = groupCurrenciesByAsset(assetsSorted || []);
  const selectableNetworkIdSet = useMemo(
    () => (selectableNetworkIds === undefined ? undefined : new Set(selectableNetworkIds)),
    [selectableNetworkIds],
  );

  const formattedAssets = useAssetConfiguration(availableAssets ?? [], {
    ApyIndicator,
    MarketPriceIndicator,
    MarketPercentIndicator,
    useBalanceDeps,
    balanceItem,
    assetsMap,
    ...assetsConfiguration,
  }).map(asset => {
    if (selectableNetworkIdSet === undefined) return asset;

    const isSelectable = assetsMap.get(asset.id)?.currencies.some(network => {
      const networkId = network.type === "CryptoCurrency" ? network.id : network.parentCurrencyId;
      return selectableNetworkIdSet.has(networkId);
    });

    return { ...asset, disabled: !isSelectable };
  });

  const handleAssetClick = useCallback(
    (asset: AssetRowData) => {
      if (asset.disabled) return;
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

  const renderItem = useCallback(
    ({ item }: { item: AssetRowData }) => (
      <AssetRow
        {...item}
        onClick={handleAssetClick}
        disabledExplanation={item.disabled ? disabledAssetExplanation?.(item.name) : undefined}
        onDisabledPress={onDisabledAssetPress}
      />
    ),
    [disabledAssetExplanation, handleAssetClick, onDisabledAssetPress],
  );

  const renderContent = () => {
    if (isLoading) return <SkeletonList />;

    if (hasError || isInternetReachable === false) {
      return (
        <GenericError
          onClick={refetch}
          type={isInternetReachable === false ? "internet" : "backend"}
        />
      );
    }

    return (
      <BottomSheetVirtualizedList
        ref={listRef}
        scrollToOverflowEnabled
        data={formattedAssets}
        keyExtractor={(item: AssetRowData) => item.id}
        getItemCount={(items: AssetRowData[]) => items.length}
        getItem={(items: AssetRowData[], index: number) => items[index]}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={<AssetsEmptyList />}
        contentContainerStyle={{
          paddingBottom: SAFE_MARGIN_BOTTOM,
        }}
        onEndReached={loadNext}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadNext ? <InfiniteLoader size={20} /> : null}
        testID="modular-drawer-select-crypto-scrollView"
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
      <BottomSheetHeader
        spacing
        title={headerTitle}
        description={headerDescription}
        testID="modular-drawer-Asset-title"
        density="expanded"
      />
      <SearchInputContainer
        source={source}
        flow={flow}
        onPressIn={expandToFullHeight}
        withHorizontalPadding
      />
      {renderContent()}
    </>
  );
};

export default withDiscreetMode(React.memo(AssetSelection));
