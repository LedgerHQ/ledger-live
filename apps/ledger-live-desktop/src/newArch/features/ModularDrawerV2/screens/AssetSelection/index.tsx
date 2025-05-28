import React, { useEffect, useRef, useState } from "react";
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
  const [shouldScrollToTop] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timeout = timeoutRef.current;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

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
      />
    </>
  );
};

export default AssetSelection;
