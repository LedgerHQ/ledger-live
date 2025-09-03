import React, { useEffect, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { SelectAssetList as AssetsList } from "./components/List";
import SearchInputContainer from "./components/SearchInputContainer";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { MODULAR_DRAWER_PAGE_NAME } from "../../analytics/modularDrawer.types";
import TrackDrawerScreen from "../../analytics/TrackDrawerScreen";
import { CurrenciesByProviderId, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { GenericError } from "../../components/GenericError";

export type AssetSelectionStepProps = {
  assetsToDisplay: CryptoOrTokenCurrency[];
  providersLoadingStatus: LoadingStatus;
  defaultSearchValue?: string;
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  flow: string;
  source: string;
  currenciesByProvider: CurrenciesByProviderId[];
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  setSearchedValue: (value: string | undefined) => void;
  hasOneCurrency?: boolean;
  loadNext?: () => void;
  error?: boolean;
  refetch?: () => void;
};

const AssetSelection = ({
  assetsToDisplay,
  defaultSearchValue,
  providersLoadingStatus,
  flow,
  source,
  assetsConfiguration,
  currenciesByProvider,
  onAssetSelected,
  setSearchedValue,
  hasOneCurrency,
  loadNext,
  error,
  refetch,
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
        setSearchedValue={setSearchedValue}
        searchedValue={defaultSearchValue}
        source={source}
        flow={flow}
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
