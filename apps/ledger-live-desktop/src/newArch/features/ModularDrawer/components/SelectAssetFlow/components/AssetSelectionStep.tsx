import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetType } from "@ledgerhq/react-ui/pre-ldls";
import { SearchInputContainer } from "../../Search";
import { SelectAsset } from "../../SelectAsset";
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
  return (
    <>
      <SearchContainer>
        <SearchInputContainer
          flow="Modular Asset Flow"
          source="Accounts"
          defaultValue={defaultSearchValue}
          setSearchedValue={setSearchedValue}
          items={sortedCryptoCurrencies}
          setItemsToDisplay={setAssetsToDisplay}
        />
      </SearchContainer>
      <SelectAsset
        assetTypes={assetTypes}
        assetsToDisplay={assetsToDisplay}
        source="Accounts"
        flow="Modular Asset Flow"
        onAssetSelected={onAssetSelected}
      />
    </>
  );
}
