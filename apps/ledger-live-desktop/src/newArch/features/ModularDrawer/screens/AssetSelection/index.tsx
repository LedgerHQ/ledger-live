import React, { useEffect, useState } from "react";
import { AssetType } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SelectAssetList as AssetsList } from "./components/List";
import { SearchInputContainer } from "./components/SearchInputContainer";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export type AssetSelectionStepProps = {
  assetTypes: AssetType[];
  assetsToDisplay: CryptoOrTokenCurrency[];
  sortedCryptoCurrencies: CryptoOrTokenCurrency[];
  defaultSearchValue?: string;
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  setAssetsToDisplay: (assets: CryptoOrTokenCurrency[]) => void;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  setSearchedValue: (value: string | undefined) => void;
};

const AssetSelection = ({
  assetTypes,
  assetsToDisplay,
  sortedCryptoCurrencies,
  defaultSearchValue,
  setAssetsToDisplay,
  onAssetSelected,
  setSearchedValue,
}: Readonly<AssetSelectionStepProps>) => {
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);

  useEffect(() => {
    if (defaultSearchValue !== undefined && defaultSearchValue.length >= 2) {
      const timeout = setTimeout(() => {
        setShouldScrollToTop(true);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [defaultSearchValue]);

  return (
    <>
      <SearchInputContainer
        setItemsToDisplay={setAssetsToDisplay}
        setSearchedValue={setSearchedValue}
        defaultValue={defaultSearchValue}
        source="Accounts"
        flow="Modular Asset Flow"
        items={sortedCryptoCurrencies}
      />
      <AssetsList
        assetTypes={assetTypes}
        assetsToDisplay={assetsToDisplay}
        source="Accounts"
        flow="Modular Asset Flow"
        scrollToTop={shouldScrollToTop}
        onAssetSelected={onAssetSelected}
        onScrolledToTop={() => setShouldScrollToTop(false)}
      />
    </>
  );
};

export default AssetSelection;
