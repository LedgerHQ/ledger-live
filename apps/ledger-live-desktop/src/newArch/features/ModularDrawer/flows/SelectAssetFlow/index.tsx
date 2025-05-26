import React, { memo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useSelectAssetFlow } from "./useSelectAssetFlow";
import { NetworkSelectionStep } from "../../components/NetworkSelectionStep";
import { AssetSelectionStep } from "../../components/AssetSelectionStep";
import { Header } from "../../components/Header";
import { FlowStep } from "../../components/Header/navigation";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

export type SelectAssetFlowProps = {
  currencies: CryptoOrTokenCurrency[];
  hideAssetSelection?: void;
  selectedAsset?: CryptoOrTokenCurrency;
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

export const SelectAssetFlowContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
`;

export const SelectorContent = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  margin: 0 16px;
  height: 100%;
`;

export const SearchContainer = styled.div`
  padding: 0 0 16px 0;
  flex: 0 1 auto;
`;
