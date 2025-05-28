import { useModularDrawerVisibility } from "./useModularDrawerVisibility";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { useCallback } from "react";
import { ModularDrawerLocation } from "../../ModularDrawerV2/enums";
import { setDrawer } from "~/renderer/drawers/Provider";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";

function selectCurrency(
  onAssetSelected: (currency: CryptoOrTokenCurrency) => void,
  assetIds?: string[],
  includeTokens?: boolean,
  currencies?: CryptoOrTokenCurrency[],
): void {
  const filteredCurrencies =
    currencies ?? listAndFilterCurrencies({ currencies: assetIds, includeTokens });

  setDrawer(
    ModularDrawerFlowManager,
    {
      currencies: filteredCurrencies,
      onAssetSelected,
    },
    {
      onRequestClose: () => setDrawer(),
    },
  );
}

export function useOpenAssetFlow(modularDrawerLocation: ModularDrawerLocation) {
  const dispatch = useDispatch();
  const { isModularDrawerVisible } = useModularDrawerVisibility();

  const openAddAccountFlow = useCallback(
    (currency?: CryptoOrTokenCurrency) => {
      dispatch(openModal("MODAL_ADD_ACCOUNTS", currency ? { currency } : undefined));
      if (currency) {
        setDrawer();
      }
    },
    [dispatch],
  );

  const openAssetFlow = useCallback(() => {
    if (isModularDrawerVisible(modularDrawerLocation)) {
      selectCurrency(openAddAccountFlow);
    } else {
      openAddAccountFlow();
    }
  }, [isModularDrawerVisible, modularDrawerLocation, openAddAccountFlow]);

  return {
    openAssetFlow,
  };
}
