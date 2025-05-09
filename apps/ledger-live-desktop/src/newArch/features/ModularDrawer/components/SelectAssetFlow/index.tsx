import React, { memo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useSelectAssetFlow, FlowStep } from "./useSelectAssetFlow";
import {
  SelectAssetFlowContainer,
  SelectorContent,
  Header,
  AssetSelectionStep,
  NetworkSelectionStep,
} from "./components";

export type SelectAssetFlowProps = {
  currencies: CryptoOrTokenCurrency[];
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
};

function SelectAssetFlow({ onAssetSelected, currencies }: Readonly<SelectAssetFlowProps>) {
  const {
    currentStep,
    navDirection,
    networksToDisplay,
    assetsToDisplay,
    setAssetsToDisplay,
    assetTypes,
    sortedCryptoCurrencies,
    handleAssetTypeSelected,
    handleNetworkSelected,
    handleBackClick,
    isLoading,
    isAssetSelection,
    defaultSearchValue,
    setSearchedValue,
  } = useSelectAssetFlow({ onAssetSelected, currencies });

  if (isLoading) {
    return null;
  }

  return (
    <SelectAssetFlowContainer>
      <Header
        isAssetSelectionVisible={currentStep === FlowStep.SELECT_ASSET_TYPE}
        currentStep={currentStep}
        navDirection={navDirection}
        onBackClick={handleBackClick}
      />

      <SelectorContent>
        {isAssetSelection ? (
          <AssetSelectionStep
            assetTypes={assetTypes}
            assetsToDisplay={assetsToDisplay}
            sortedCryptoCurrencies={sortedCryptoCurrencies}
            defaultSearchValue={defaultSearchValue}
            setSearchedValue={setSearchedValue}
            setAssetsToDisplay={setAssetsToDisplay}
            onAssetSelected={handleAssetTypeSelected}
          />
        ) : (
          <NetworkSelectionStep
            networks={networksToDisplay}
            onNetworkSelected={handleNetworkSelected}
          />
        )}
      </SelectorContent>
    </SelectAssetFlowContainer>
  );
}

export default memo(SelectAssetFlow);
