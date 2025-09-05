import React, { useEffect, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SelectAssetList as AssetsList } from "./components/List";
import SearchInputContainer from "./components/SearchInputContainer";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { MODULAR_DRAWER_PAGE_NAME } from "../../analytics/modularDrawer.types";
import TrackDrawerScreen from "../../analytics/TrackDrawerScreen";
import { CurrenciesByProviderId, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { GenericError } from "../../components/GenericError";
import { useSelector } from "react-redux";
import { modularDrawerStateSelector } from "~/renderer/reducers/modularDrawer";

export type AssetSelectionStepProps = {
  assetsToDisplay: CryptoOrTokenCurrency[];
  originalAssetsToDisplay: CryptoOrTokenCurrency[];
  sortedCryptoCurrencies: CryptoOrTokenCurrency[];
  providersLoadingStatus: LoadingStatus;
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  flow: string;
  source: string;
  currenciesByProvider: CurrenciesByProviderId[];
  setAssetsToDisplay: (assets: CryptoOrTokenCurrency[]) => void;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  hasOneCurrency?: boolean;
  loadNext?: () => void;
  error?: boolean;
  refetch?: () => void;
};

const AssetSelection = ({
  assetsToDisplay,
  originalAssetsToDisplay,
  sortedCryptoCurrencies,
  providersLoadingStatus,
  flow,
  source,
  assetsConfiguration,
  currenciesByProvider,
  setAssetsToDisplay,
  onAssetSelected,
  hasOneCurrency,
  loadNext,
  error,
  refetch,
}: Readonly<AssetSelectionStepProps>) => {
  const { searchedValue } = useSelector(modularDrawerStateSelector);
  const [shouldScrollToTop, setShouldScrollToTop] = useState(false);

  useEffect(() => {
    if (searchedValue === undefined) {
      return;
    }

    const timeout = setTimeout(() => {
      setShouldScrollToTop(true);
    }, 100);

    return () => clearTimeout(timeout);
  }, [searchedValue]);

  return (
    <>
      {!hasOneCurrency && (
        <TrackDrawerScreen
          page={MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION}
          source={source}
          flow={flow}
          assetsConfig={assetsConfiguration}
          formatAssetConfig
        />
      )}
      <SearchInputContainer
        setItemsToDisplay={setAssetsToDisplay}
        source={source}
        flow={flow}
        items={sortedCryptoCurrencies}
        assetsToDisplay={assetsToDisplay}
        originalAssets={originalAssetsToDisplay}
      />
      {error && refetch ? (
        <GenericError onClick={refetch} />
      ) : (
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
          loadNext={loadNext}
        />
      )}
    </>
  );
};

export default React.memo(AssetSelection);
