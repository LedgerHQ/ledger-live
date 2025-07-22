import React, { useEffect, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetList, AssetType } from "@ledgerhq/native-ui/pre-ldls/index";
import { Flex } from "@ledgerhq/native-ui";
import SearchInputContainer from "./components/SearchInputContainer";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import {
  useModularDrawerAnalytics,
  TrackDrawerScreen,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
} from "../../analytics";

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

const AssetSelection = ({
  isOpen,
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
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const handleAssetClick = (asset: AssetType) => {
    const originalAsset = availableAssets.find(a => a.id === asset.id);
    if (originalAsset) {
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
  };

  useEffect(() => {
    if (defaultSearchValue === undefined) {
      return;
    }

    setItemsToDisplay(
      availableAssets.filter(asset =>
        asset.name.toLowerCase().includes(defaultSearchValue.toLowerCase()),
      ),
    );

    const timeout = setTimeout(() => {
      setShouldScrollToTop(false);
    }, 100);

    setShouldScrollToTop(true);
    return () => clearTimeout(timeout);
  }, [defaultSearchValue, availableAssets, setItemsToDisplay]);

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

      <Flex>
        <SearchInputContainer
          source={source}
          flow={flow}
          items={availableAssets}
          setItemsToDisplay={setItemsToDisplay}
          assetsToDisplay={itemsToDisplay}
          originalAssets={availableAssets}
          setSearchedValue={setDefaultSearchValue}
          defaultValue={defaultSearchValue}
          assetsConfiguration={assetsConfiguration}
          formatAssetConfig={!!assetsConfiguration}
        />
        <AssetList
          assets={itemsToDisplay}
          onClick={handleAssetClick}
          scrollToTop={shouldScrollToTop}
        />
      </Flex>
    </>
  );
};

export default React.memo(AssetSelection);
