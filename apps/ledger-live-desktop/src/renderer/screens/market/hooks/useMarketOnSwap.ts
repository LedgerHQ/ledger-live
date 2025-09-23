import { useCallback } from "react";
import { track } from "~/renderer/analytics/segment";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { AccountLike } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setDrawer } from "~/renderer/drawers/Provider";
import {
  ModularDrawerLocation,
  ModularDrawerVisibleParams,
  openAssetAndAccountDrawer,
} from "LLD/features/ModularDrawer";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";

type UseMarketOnSwapProps = {
  currencyTicker?: string;
  page?: string;
  swapDefaultTrack: Record<string, unknown>;
  currencies: CryptoOrTokenCurrency[];
  isModularDrawerVisible: (params: ModularDrawerVisibleParams) => boolean;
  onSwapAccountSelected: (account: AccountLike) => void;
};

export function useMarketOnSwap({
  currencyTicker,
  page,
  swapDefaultTrack,
  currencies,
  isModularDrawerVisible,
  onSwapAccountSelected,
}: UseMarketOnSwapProps) {
  return useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      track("button_clicked2", {
        button: "swap",
        currency: currencyTicker,
        page,
        ...swapDefaultTrack,
      });
      setTrackingSource(page);

      const modularDrawerVisible = isModularDrawerVisible({
        location: ModularDrawerLocation.LIVE_APP,
        liveAppId: "swap",
      });

      if (modularDrawerVisible) {
        openAssetAndAccountDrawer({
          currencies,
          useCase: "swap",
          onSuccess: onSwapAccountSelected,
          onCancel: () => setDrawer(),
          flow: "swap",
          source: page ?? "Page Market",
        });
      } else {
        setDrawer(
          SelectAccountAndCurrencyDrawer,
          {
            currencies,
            flow: "swap",
            source: page,
            onAccountSelected: onSwapAccountSelected,
          },
          {
            onRequestClose: () => setDrawer(),
          },
        );
      }
    },
    [
      page,
      currencies,
      isModularDrawerVisible,
      onSwapAccountSelected,
      swapDefaultTrack,
      currencyTicker,
    ],
  );
}
