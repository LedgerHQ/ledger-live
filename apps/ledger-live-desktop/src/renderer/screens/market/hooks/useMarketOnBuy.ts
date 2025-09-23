import { useCallback } from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { setDrawer } from "~/renderer/drawers/Provider";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import {
  ModularDrawerLocation,
  ModularDrawerVisibleParams,
  openAssetAndAccountDrawer,
} from "LLD/features/ModularDrawer";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setFlowValue, setSourceValue } from "~/renderer/reducers/modularDrawer";
import { useDispatch } from "react-redux";

const DRAWER_FLOW = "buy";

type UseMarketOnBuyProps = {
  page?: string;
  currencies: CryptoOrTokenCurrency[];
  isModularDrawerVisible: (params: ModularDrawerVisibleParams) => boolean;
  onBuyAccountSelected: (account: AccountLike) => void;
};

export function useMarketOnBuy({
  page,
  currencies,
  isModularDrawerVisible,
  onBuyAccountSelected,
}: UseMarketOnBuyProps) {
  const dispatch = useDispatch();

  return useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setTrackingSource(page);

      const modularDrawerVisible = isModularDrawerVisible({
        location: ModularDrawerLocation.LIVE_APP,
        liveAppId: "buy",
      });

      if (modularDrawerVisible) {
        dispatch(setFlowValue(DRAWER_FLOW));
        dispatch(setSourceValue(page ?? "Page Market"));
        openAssetAndAccountDrawer({
          currencies,
          useCase: "buy",
          onSuccess: onBuyAccountSelected,
          onCancel: () => setDrawer(),
        });
      } else {
        setDrawer(
          SelectAccountAndCurrencyDrawer,
          {
            currencies,
            flow: DRAWER_FLOW,
            source: page,
            onAccountSelected: onBuyAccountSelected,
          },
          {
            onRequestClose: () => setDrawer(),
          },
        );
      }
    },
    [page, isModularDrawerVisible, dispatch, currencies, onBuyAccountSelected],
  );
}
