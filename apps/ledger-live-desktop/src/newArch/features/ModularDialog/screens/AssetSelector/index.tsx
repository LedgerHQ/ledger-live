import React, { useEffect, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import SearchInputContainer from "./components/SearchInputContainer";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { MODULAR_DRAWER_PAGE_NAME } from "../../analytics/modularDrawer.types";
import TrackDrawerScreen from "../../analytics/TrackDrawerScreen";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { GenericError } from "../../components/GenericError";
import { useSelector } from "react-redux";
import { modularDrawerSearchedSelector } from "~/renderer/reducers/modularDrawer";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { AssetSelectorContent } from "./components/AssetSelectorContent";
import { ErrorInfo } from "@ledgerhq/live-common/dada-client/utils/errorUtils";

export type AssetSelectorProps = {
  assetsToDisplay: CryptoOrTokenCurrency[];
  providersLoadingStatus: LoadingStatus;
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  loadNext?: () => void;
  errorInfo?: ErrorInfo;
  refetch?: () => void;
  assetsSorted?: AssetData[];
};

const AssetSelector = ({
  assetsToDisplay,
  providersLoadingStatus,
  assetsConfiguration,
  onAssetSelected,
  loadNext,
  errorInfo,
  refetch,
  assetsSorted,
}: Readonly<AssetSelectorProps>) => {
  const searchedValue = useSelector(modularDrawerSearchedSelector);

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
      {assetsSorted?.length !== 1 && (
        <TrackDrawerScreen
          page={MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION}
          assetsConfig={assetsConfiguration}
          formatAssetConfig
        />
      )}
      <SearchInputContainer />
      {errorInfo?.hasError ? (
        <GenericError onClick={refetch} type={errorInfo.isNetworkError ? "network" : "backend"} />
      ) : (
        <AssetSelectorContent
          assetsToDisplay={assetsToDisplay}
          providersLoadingStatus={providersLoadingStatus}
          assetsConfiguration={assetsConfiguration}
          scrollToTop={shouldScrollToTop}
          onAssetSelected={onAssetSelected}
          onScrolledToTop={() => setShouldScrollToTop(false)}
          loadNext={loadNext}
          assetsSorted={assetsSorted}
        />
      )}
    </>
  );
};

export default React.memo(AssetSelector);
