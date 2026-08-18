import React, { useEffect, useState } from "react";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import SearchInputContainer from "./components/SearchInputContainer";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { MODULAR_DIALOG_PAGE_NAME } from "../../analytics/modularDialog.types";
import TrackDialogScreen from "../../analytics/TrackDialogScreen";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { GenericError } from "../../components/GenericError";
import { useSelector } from "LLD/hooks/redux";
import { modularDialogSearchedSelector } from "~/renderer/reducers/modularDialog";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { AssetSelectorContent } from "./components/AssetSelectorContent";
import type { ErrorInfo } from "@domain/api-aggregated-assets";

export type AssetSelectorProps = {
  assetsToDisplay: CryptoOrTokenCurrency[];
  providersLoadingStatus: LoadingStatus;
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  fillAvailableHeight?: boolean;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  loadNext?: () => void;
  errorInfo?: ErrorInfo;
  refetch?: () => void;
  assetsSorted?: AssetData[];
  disabledAssetIds?: ReadonlySet<string>;
};

const AssetSelector = ({
  assetsToDisplay,
  providersLoadingStatus,
  assetsConfiguration,
  fillAvailableHeight,
  onAssetSelected,
  loadNext,
  errorInfo,
  refetch,
  assetsSorted,
  disabledAssetIds,
}: Readonly<AssetSelectorProps>) => {
  const searchedValue = useSelector(modularDialogSearchedSelector);

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
        <TrackDialogScreen
          page={MODULAR_DIALOG_PAGE_NAME.MODULAR_ASSET_SELECTION}
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
          fillAvailableHeight={fillAvailableHeight}
          scrollToTop={shouldScrollToTop}
          onAssetSelected={onAssetSelected}
          onScrolledToTop={() => setShouldScrollToTop(false)}
          loadNext={loadNext}
          assetsSorted={assetsSorted}
          disabledAssetIds={disabledAssetIds}
        />
      )}
    </>
  );
};

export default React.memo(AssetSelector);
