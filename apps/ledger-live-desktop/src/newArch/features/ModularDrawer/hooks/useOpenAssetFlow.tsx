import { useModularDrawerVisibility } from "./useModularDrawerVisibility";
import { openModal } from "~/renderer/actions/modals";
import { useDispatch } from "react-redux";
import { useCallback } from "react";
import { ModularDrawerLocation } from "../enums";
import { setDrawer } from "~/renderer/drawers/Provider";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import { useModularDrawerAnalytics } from "../analytics/useModularDrawerAnalytics";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";

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

export function useOpenAssetFlow(modularDrawerLocation: ModularDrawerLocation, source: string) {
  const dispatch = useDispatch();
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

  const openAddAccountFlow = useCallback(
    (currency?: CryptoOrTokenCurrency) => {
      dispatch(openModal("MODAL_ADD_ACCOUNTS", currency ? { currency } : undefined));
      if (currency) {
        setDrawer();
      }
    },
    [dispatch],
  );

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
