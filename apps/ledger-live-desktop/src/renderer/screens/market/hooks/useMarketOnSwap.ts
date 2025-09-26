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
import { setFlowValue, setSourceValue } from "~/renderer/reducers/modularDrawer";
import { useDispatch } from "react-redux";

const DRAWER_FLOW = "swap";

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
  const dispatch = useDispatch();

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
        dispatch(setFlowValue(DRAWER_FLOW));
        dispatch(setSourceValue(page ?? "Page Market"));
        openAssetAndAccountDrawer({
          currencies,
          useCase: "swap",
          onSuccess: onSwapAccountSelected,
          onCancel: () => setDrawer(),
        });
      } else {
        setDrawer(
          SelectAccountAndCurrencyDrawer,
          {
            currencies,
            flow: DRAWER_FLOW,
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
      currencyTicker,
      page,
      swapDefaultTrack,
      isModularDrawerVisible,
      dispatch,
      currencies,
      onSwapAccountSelected,
    ],
  );
}
