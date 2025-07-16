import React, { memo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useSelectAssetFlow } from "./useSelectAssetFlow";
import {
  SelectAssetFlowContainer,
  SelectorContent,
  AssetSelectionStep,
  NetworkSelectionStep,
} from "./components";
import { Header } from "../Header";
import { FlowStep } from "../Header/navigation";
import { useTranslation } from "react-i18next";

export type SelectAssetFlowProps = {
  currencies: CryptoOrTokenCurrency[];
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
};

function SelectAssetFlow({ onAssetSelected, currencies }: Readonly<SelectAssetFlowProps>) {
  const { t } = useTranslation();

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
        showBackButton={currentStep === FlowStep.SELECT_NETWORK}
        navKey={currentStep}
        title={
          isAssetSelection
            ? t("modularAssetDrawer.assetFlow.asset")
            : t("modularAssetDrawer.assetFlow.network")
        }
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
