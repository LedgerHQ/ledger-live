import React, { useCallback } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { ModularDrawerVisibleParams, useModularDrawerVisibility } from "LLD/features/ModularDrawer";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { setDrawer } from "~/renderer/drawers/Provider";
import { GlobalModalData } from "~/renderer/modals/types";
import ModularDrawerAddAccountFlowManager from "../../AddAccountDrawer/ModularDrawerAddAccountFlowManager";
import ModularDrawerFlowManager from "../ModularDialogFlowManager";
import { useModularDrawerAnalytics } from "../analytics/useModularDrawerAnalytics";
import { CloseButton } from "../components/CloseButton";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { setFlowValue, setSourceValue } from "~/renderer/reducers/modularDrawer";
import { useDialog } from "LLD/components/Dialog";

function selectCurrencyDialog(
  onAssetSelected: (currency: CryptoOrTokenCurrency) => void,
  openDialog: (content: React.ReactNode, onClose?: () => void) => void,
  currencies?: CryptoOrTokenCurrency[],
  onClose?: () => void,
  drawerConfiguration?: EnhancedModularDrawerConfiguration,
): void {
  const filteredCurrencies = currencies?.map(currency => currency.id) ?? [];

  openDialog(
    <ModularDrawerFlowManager
      currencies={filteredCurrencies}
      onAssetSelected={onAssetSelected}
      drawerConfiguration={
        drawerConfiguration ?? {
          assets: { leftElement: "undefined", rightElement: "balance" },
          networks: { leftElement: "numberOfAccounts", rightElement: "balance" },
        }
      }
    />,
    onClose,
  );
}

export function useOpenAssetFlowDialog(
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

  const { openDialog, closeDialog } = useDialog();

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
      onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void,
    ) => {
      closeDialog();
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
      closeDialog,
      dispatch,
      featureNetworkBasedAddAccount?.enabled,
      modalNameToReopen,
      source,
      trackModularDrawerEvent,
    ],
  );

  const openAssetFlowDialog = useCallback(
    (drawerConfiguration?: EnhancedModularDrawerConfiguration) => {
      if (isModularDrawerVisible(modularDrawerVisibleParams)) {
        dispatch(setFlowValue(modularDrawerVisibleParams.location));
        dispatch(setSourceValue(source));
        selectCurrencyDialog(
          openAddAccountFlow,
          openDialog,
          undefined,
          handleClose,
          drawerConfiguration,
        );
      } else {
        closeDialog();
        dispatch(
          openModal("MODAL_ADD_ACCOUNTS", {
            newModalName: modalNameToReopen,
          }),
        );
      }
    },
    [
      closeDialog,
      dispatch,
      handleClose,
      isModularDrawerVisible,
      modalNameToReopen,
      modularDrawerVisibleParams,
      openAddAccountFlow,
      openDialog,
      source,
    ],
  );

  return {
    openAssetFlowDialog,
    openAddAccountFlow,
  };
}
