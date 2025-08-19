import React, { useEffect, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SelectAssetList as AssetsList } from "./components/List";
import SearchInputContainer from "./components/SearchInputContainer";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { MODULAR_DRAWER_PAGE_NAME } from "../../analytics/modularDrawer.types";
import TrackDrawerScreen from "../../analytics/TrackDrawerScreen";
import { CurrenciesByProviderId, LoadingStatus } from "@ledgerhq/live-common/deposit/type";

export type AssetSelectionStepProps = {
  assetsToDisplay: CryptoOrTokenCurrency[];
  originalAssetsToDisplay: CryptoOrTokenCurrency[];
  sortedCryptoCurrencies: CryptoOrTokenCurrency[];
  providersLoadingStatus: LoadingStatus;
  defaultSearchValue?: string;
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  flow: string;
  source: string;
  currenciesByProvider: CurrenciesByProviderId[];
  setAssetsToDisplay: (assets: CryptoOrTokenCurrency[]) => void;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  setSearchedValue: (value: string | undefined) => void;
};

const AssetSelection = ({
  assetsToDisplay,
  originalAssetsToDisplay,
  sortedCryptoCurrencies,
  defaultSearchValue,
  providersLoadingStatus,
  flow,
  source,
  assetsConfiguration,
  currenciesByProvider,
  setAssetsToDisplay,
  onAssetSelected,
  setSearchedValue,
}: Readonly<AssetSelectionStepProps>) => {
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);

  useEffect(() => {
    if (defaultSearchValue === undefined) {
      return;
    }

    const timeout = setTimeout(() => {
      setShouldScrollToTop(true);
    }, 100);

    return () => clearTimeout(timeout);
  }, [defaultSearchValue]);

  return (
    <>
      <TrackDrawerScreen
        page={MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION}
        source={source}
        flow={flow}
        assetsConfig={assetsConfiguration}
        formatAssetConfig
      />
      <SearchInputContainer
        setItemsToDisplay={setAssetsToDisplay}
        setSearchedValue={setSearchedValue}
        defaultValue={defaultSearchValue}
        source={source}
        flow={flow}
        items={sortedCryptoCurrencies}
        assetsToDisplay={assetsToDisplay}
        originalAssets={originalAssetsToDisplay}
      />
      <AssetsList
        assetsToDisplay={assetsToDisplay}
        providersLoadingStatus={providersLoadingStatus}
        source={source}
        flow={flow}
        assetsConfiguration={assetsConfiguration}
        currenciesByProvider={currenciesByProvider}
        scrollToTop={shouldScrollToTop}
        onAssetSelected={onAssetSelected}
        onScrolledToTop={() => setShouldScrollToTop(false)}
      />
    </>
  );
};

export default React.memo(AssetSelection);
