import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCallback } from "react";
import { setDrawer } from "~/renderer/drawers/Provider";
import { ModularDrawerLocation } from "../enums";
import ModularDrawerAddAccountFlowManager from "../ModularDrawerAddAccountFlowManager";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import { useModularDrawerVisibility } from "./useModularDrawerVisibility";

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
  const { isModularDrawerVisible } = useModularDrawerVisibility();

  const openAddAccountFlow = useCallback((currency?: CryptoOrTokenCurrency) => {
    if (currency) {
      setDrawer(ModularDrawerAddAccountFlowManager, {
        currency,
      });
    }
    // TODO else?
  }, []);

  const openAssetFlow = useCallback(
    (includeTokens: boolean) => {
      if (isModularDrawerVisible(modularDrawerLocation)) {
        selectCurrency(openAddAccountFlow, undefined, includeTokens);
      } else {
        openAddAccountFlow();
      }
    },
    [isModularDrawerVisible, modularDrawerLocation, openAddAccountFlow],
  );

  return {
    openAssetFlow,
  };
}
