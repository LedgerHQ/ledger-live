import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { ModularDrawerVisibleParams, useModularDrawerVisibility } from "LLD/features/ModularDrawer";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { setDrawer } from "~/renderer/drawers/Provider";
import { GlobalModalData } from "~/renderer/modals/types";
import ModularDrawerAddAccountFlowManager from "../../AddAccountDrawer/ModularDrawerAddAccountFlowManager";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import { useModularDrawerAnalytics } from "../analytics/useModularDrawerAnalytics";
import { CloseButton } from "../components/CloseButton";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { setFlowValue, setSourceValue } from "~/renderer/reducers/modularDrawer";

function selectCurrency(
  onAssetSelected: (currency: CryptoOrTokenCurrency) => void,
  currencies?: CryptoOrTokenCurrency[],
  onClose?: () => void,
  drawerConfiguration?: EnhancedModularDrawerConfiguration,
): void {
  const filteredCurrencies = currencies?.map(currency => currency.id) ?? [];

  setDrawer(
    ModularDrawerFlowManager,
    {
      currencies: filteredCurrencies,
      onAssetSelected,
      drawerConfiguration: drawerConfiguration ?? {
        assets: { leftElement: "undefined", rightElement: "balance" },
        networks: { leftElement: "numberOfAccounts", rightElement: "balance" },
      },
    },
    {
      onRequestClose: onClose,
      closeButtonComponent: CloseButton,
    },
  );
}

export function useOpenAssetFlow(
  modularDrawerVisibleParams: ModularDrawerVisibleParams,
  source: string,
  modalNameToReopen?: keyof GlobalModalData,
) {
  const dispatch = useDispatch();
  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "lldModularDrawer",
  });
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const featureNetworkBasedAddAccount = useFeature("lldNetworkBasedAddAccount");

  const handleClose = useCallback(() => {
    setDrawer();
    trackModularDrawerEvent("button_clicked", {
      button: "Close",
      page: currentRouteNameRef.current ?? "Unknown",
    });
  }, [trackModularDrawerEvent]);

  const openAddAccountFlow = useCallback(
    (
      currency: CryptoOrTokenCurrency,
      autoCloseDrawer: boolean = true,
      onAccountSelected?: (account: Account) => void,
    ) => {
      dispatch(setFlowValue("add account"));
      dispatch(setSourceValue(source));

      const onClose = () => {
        setDrawer();
        trackModularDrawerEvent("button_clicked", {
          button: "Close",
          page: currentRouteNameRef.current ?? "Unknown",
        });
      };

      const onFlowFinishedWithModalReopen = () => {
        setDrawer();
        if (modalNameToReopen) {
          dispatch(openModal(modalNameToReopen, undefined));
        }
      };
      if (featureNetworkBasedAddAccount?.enabled) {
        setDrawer(
          ModularDrawerAddAccountFlowManager,
          {
            currency,
            onAccountSelected: modalNameToReopen
              ? onFlowFinishedWithModalReopen
              : onAccountSelected,
          },
          { closeButtonComponent: CloseButton, onRequestClose: onClose },
        );
      } else {
        const cryptoCurrency =
          currency.type === "CryptoCurrency" ? currency : currency.parentCurrency;
        autoCloseDrawer && setDrawer();
        dispatch(
          openModal("MODAL_ADD_ACCOUNTS", {
            currency: cryptoCurrency,
            newModalName: modalNameToReopen,
          }),
        );
      }
    },
    [
      dispatch,
      featureNetworkBasedAddAccount?.enabled,
      modalNameToReopen,
      source,
      trackModularDrawerEvent,
    ],
  );

  const openAssetFlow = useCallback(
    (drawerConfiguration?: EnhancedModularDrawerConfiguration) => {
      if (isModularDrawerVisible(modularDrawerVisibleParams)) {
        dispatch(setFlowValue(modularDrawerVisibleParams.location));
        dispatch(setSourceValue(source));
        selectCurrency(openAddAccountFlow, undefined, handleClose, drawerConfiguration);
      } else {
        dispatch(
          openModal("MODAL_ADD_ACCOUNTS", {
            newModalName: modalNameToReopen,
          }),
        );
      }
    },
    [
      dispatch,
      handleClose,
      isModularDrawerVisible,
      modalNameToReopen,
      modularDrawerVisibleParams,
      openAddAccountFlow,
      source,
    ],
  );

  return {
    openAssetFlow,
    openAddAccountFlow,
  };
}
