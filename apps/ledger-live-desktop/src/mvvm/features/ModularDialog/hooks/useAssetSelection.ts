import { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useAcceptedCurrency } from "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency";
import type { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { useSelector } from "LLD/hooks/redux";
import { modularDialogFlowSelector } from "~/renderer/reducers/modularDialog";

function getNetworkId(currency: CryptoOrTokenCurrency): string {
  return currency.type === "CryptoCurrency" ? currency.id : currency.parentCurrencyId;
}

export function useAssetSelection(
  sortedCryptoCurrencies: CryptoOrTokenCurrency[],
  assetsSorted: AssetData[] | undefined = [],
  selectableNetworkIds: readonly string[] | undefined = undefined,
) {
  const flow = useSelector(modularDialogFlowSelector);
  const isAcceptedCurrency = useAcceptedCurrency({ flow });

  const assetsToDisplay = useMemo(
    () => sortedCryptoCurrencies.filter(currency => isAcceptedCurrency(currency)),
    [sortedCryptoCurrencies, isAcceptedCurrency],
  );
  const disabledAssetIds = useMemo(() => {
    if (selectableNetworkIds === undefined) {
      return new Set<string>();
    }

    const selectableIds = new Set(selectableNetworkIds);
    return new Set(
      assetsSorted
        ?.filter(
          asset =>
            !asset.networks.some(
              network => isAcceptedCurrency(network) && selectableIds.has(getNetworkId(network)),
            ),
        )
        .map(asset => asset.asset.id),
    );
  }, [assetsSorted, isAcceptedCurrency, selectableNetworkIds]);

  return {
    assetsToDisplay,
    disabledAssetIds,
  };
}
