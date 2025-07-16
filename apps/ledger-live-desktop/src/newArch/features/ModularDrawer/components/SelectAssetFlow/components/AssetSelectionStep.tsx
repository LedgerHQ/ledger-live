import React, { useEffect, useRef, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetType } from "@ledgerhq/react-ui/pre-ldls";
import { SearchInputContainer } from "../../Search";
import { SelectAsset } from "./SelectAsset";
import { SearchContainer } from "./StyledComponents";

export type AssetSelectionStepProps = {
  assetTypes: AssetType[];
  assetsToDisplay: CryptoOrTokenCurrency[];
  sortedCryptoCurrencies: CryptoOrTokenCurrency[];
  defaultSearchValue?: string;
  setSearchedValue?: (value: string | undefined) => void;
  setAssetsToDisplay: (assets: CryptoOrTokenCurrency[]) => void;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
};

export function AssetSelectionStep({
  assetTypes,
  assetsToDisplay,
  sortedCryptoCurrencies,
  defaultSearchValue,
  setSearchedValue,
  setAssetsToDisplay,
  onAssetSelected,
}: Readonly<AssetSelectionStepProps>) {
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSearch = (query: string) => {
    setSearchedValue?.(query);

    setShouldScrollToTop(true);

    timeoutRef.current = setTimeout(() => {
      setShouldScrollToTop(false);
    }, 100);
  };

  return (
    <>
      <SearchContainer>
        <SearchInputContainer
          flow="Modular Asset Flow"
          source="Accounts"
          defaultValue={defaultSearchValue}
          setSearchedValue={handleSearch}
          items={sortedCryptoCurrencies}
          setItemsToDisplay={setAssetsToDisplay}
        />
      </SearchContainer>
      <SelectAsset
        scrollToTop={shouldScrollToTop}
        assetTypes={assetTypes}
        assetsToDisplay={assetsToDisplay}
        source="Accounts"
        flow="Modular Asset Flow"
        onAssetSelected={onAssetSelected}
      />
    </>
  );
}
