import React, { useEffect, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetList, AssetType } from "@ledgerhq/native-ui/pre-ldls/index";
import { Flex } from "@ledgerhq/native-ui";
import SearchInputContainer from "./components/SearchInputContainer";

export type AssetSelectionStepProps = {
  availableAssets: CryptoOrTokenCurrency[];
  defaultSearchValue: string;
  setDefaultSearchValue: (value: string) => void;
  itemsToDisplay: CryptoOrTokenCurrency[];
  setItemsToDisplay: (items: CryptoOrTokenCurrency[]) => void;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
};

const AssetSelection = ({
  availableAssets,
  defaultSearchValue,
  setDefaultSearchValue,
  itemsToDisplay,
  setItemsToDisplay,
  onAssetSelected,
}: Readonly<AssetSelectionStepProps>) => {
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);

  const handleAssetClick = (asset: AssetType) => {
    const originalAsset = availableAssets.find(a => a.id === asset.id);
    if (originalAsset) {
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
    <Flex>
      <SearchInputContainer
        source="modular-drawer"
        flow="asset-selection"
        items={availableAssets}
        setItemsToDisplay={setItemsToDisplay}
        assetsToDisplay={itemsToDisplay}
        originalAssets={availableAssets}
        setSearchedValue={setDefaultSearchValue}
        defaultValue={defaultSearchValue}
      />
      <AssetList
        assets={itemsToDisplay}
        onClick={handleAssetClick}
        scrollToTop={shouldScrollToTop}
      />
    </Flex>
  );
};

export default React.memo(AssetSelection);
