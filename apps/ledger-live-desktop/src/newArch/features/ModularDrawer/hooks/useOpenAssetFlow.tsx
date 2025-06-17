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
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { CloseButton } from "../components/CloseButton";

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
      drawerConfiguration: {
        assets: { leftElement: "undefined", rightElement: "undefined" },
        networks: { leftElement: "undefined", rightElement: "undefined" },
      },
    },
    {
      onRequestClose: onClose,
      closeButtonComponent: CloseButton,
    },
  );
}

export function useOpenAssetFlow(modularDrawerLocation: ModularDrawerLocation, source: string) {
  const { isModularDrawerVisible } = useModularDrawerVisibility();
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    setDrawer();
    trackModularDrawerEvent("button_clicked", {
      button: "Close",
      flow: modularDrawerLocation,
      page: currentRouteNameRef.current ?? "Unknown",
    });
  }, [modularDrawerLocation, trackModularDrawerEvent]);

  const openAddAccountFlow = useCallback((currency: CryptoOrTokenCurrency) => {
    setDrawer(ModularDrawerAddAccountFlowManager, {
      currency,
    });
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
        dispatch(openModal("MODAL_ADD_ACCOUNTS", undefined));
      }
    },
    [
      dispatch,
      handleClose,
      isModularDrawerVisible,
      modularDrawerLocation,
      openAddAccountFlow,
      source,
    ],
  );

  return {
    openAssetFlow,
  };
}
