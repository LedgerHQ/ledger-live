import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCallback } from "react";
import { setDrawer } from "~/renderer/drawers/Provider";
import { ModularDrawerLocation } from "../enums";
import ModularDrawerAddAccountFlowManager from "../ModularDrawerAddAccountFlowManager";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import { useModularDrawerAnalytics } from "../analytics/useModularDrawerAnalytics";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { useModularDrawerVisibility } from "./useModularDrawerVisibility";

function selectCurrency(
  onAssetSelected: (currency: CryptoOrTokenCurrency) => void,
  source: string,
  flow: string,
  assetIds?: string[],
  includeTokens?: boolean,
  currencies?: CryptoOrTokenCurrency[],
  onClose?: () => void,
): void {
  const filteredCurrencies =
    currencies ?? listAndFilterCurrencies({ currencies: assetIds, includeTokens });

  setDrawer(
    ModularDrawerFlowManager,
    {
      currencies: filteredCurrencies,
      onAssetSelected,
      source,
      flow,
    },
    {
      onRequestClose: onClose,
    },
  );
}

<<<<<<< HEAD
export function useOpenAssetFlow(modularDrawerLocation: ModularDrawerLocation, source: string) {
  const dispatch = useDispatch();
=======
export function useOpenAssetFlow(modularDrawerLocation: ModularDrawerLocation) {
>>>>>>> 00153fa9e0 (feat: kick off 'add account flow', add ConnectYourDevice screen)
  const { isModularDrawerVisible } = useModularDrawerVisibility();
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const handleClose = useCallback(() => {
    setDrawer();
    trackModularDrawerEvent("button_clicked", {
      button: "Close",
      flow: modularDrawerLocation,
      page: currentRouteNameRef.current ?? "Unknown",
    });
  }, [modularDrawerLocation, trackModularDrawerEvent]);

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
        selectCurrency(
          openAddAccountFlow,
          source,
          modularDrawerLocation,
          undefined,
          includeTokens,
          undefined,
          handleClose,
        );
      } else {
        openAddAccountFlow();
      }
    },
    [handleClose, isModularDrawerVisible, modularDrawerLocation, openAddAccountFlow, source],
  );

  return {
    openAssetFlow,
  };
}
