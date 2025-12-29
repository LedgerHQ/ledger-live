import { useCallback } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import {
  useModularDrawerVisibility,
  ModularDrawerVisibleParams,
} from "@ledgerhq/live-common/modularDrawer/useModularDrawerVisibility";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { setDrawer } from "~/renderer/drawers/Provider";
import { GlobalModalData } from "~/renderer/modals/types";
import ModularDrawerAddAccountFlowManager from "../../AddAccountDrawer/ModularDrawerAddAccountFlowManager";
import { useModularDialogAnalytics } from "../analytics/useModularDialogAnalytics";
import { CloseButton } from "../components/CloseButton";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import {
  setFlowValue,
  setSourceValue,
  openDialog,
  closeDialog,
} from "~/renderer/reducers/modularDrawer";
import { useOpenAssetFlow as useOpenAssetFlowDrawer } from "../../ModularDrawer/hooks/useOpenAssetFlow";

function selectCurrencyDialog(
  dispatch: ReturnType<typeof useDispatch>,
  onAssetSelected: (currency: CryptoOrTokenCurrency) => void,
  currencies?: CryptoOrTokenCurrency[],
  onClose?: () => void,
  drawerConfiguration?: EnhancedModularDrawerConfiguration,
): void {
  const filteredCurrencies = currencies?.map(currency => currency.id) ?? [];

  dispatch(
    openDialog({
      currencies: filteredCurrencies,
      onAssetSelected,
      drawerConfiguration: drawerConfiguration ?? {
        assets: { leftElement: "undefined", rightElement: "balance" },
        networks: { leftElement: "numberOfAccounts", rightElement: "balance" },
      },
      onClose,
    }),
  );
}

export function useOpenAssetFlow(
  modularDrawerVisibleParams: ModularDrawerVisibleParams,
  source: string,
  modalNameToReopen?: keyof GlobalModalData,
) {
  // Interim hook to switch between dialog and modular drawer implementation
  // To be removed when dialog implementation is fully deprecated LIVE-23773
  const featureModularDrawer = useFeature("lldModularDrawer");

  const { openAssetFlowDialog, openAddAccountFlow } = useOpenAssetFlowDialog(
    modularDrawerVisibleParams,
    source,
    modalNameToReopen,
  );

  const { openAssetFlow: openAssetFlowDrawer, openAddAccountFlow: openAddAccountFlowDrawer } =
    useOpenAssetFlowDrawer(modularDrawerVisibleParams, source, modalNameToReopen);

  if (featureModularDrawer?.params?.enableDialogDesktop) {
    return {
      openAssetFlow: openAssetFlowDialog,
      openAddAccountFlow,
    };
  }

  return {
    openAssetFlow: openAssetFlowDrawer,
    openAddAccountFlow: openAddAccountFlowDrawer,
  };
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
  const { trackModularDialogEvent } = useModularDialogAnalytics();
  const featureNetworkBasedAddAccount = useFeature("lldNetworkBasedAddAccount");

  const handleClose = useCallback(() => {
    setDrawer();
    trackModularDialogEvent("button_clicked", {
      button: "Close",
      page: currentRouteNameRef.current ?? "Unknown",
    });
  }, [trackModularDialogEvent]);

  const openAddAccountFlow = useCallback(
    (
      currency: CryptoOrTokenCurrency,
      autoCloseDrawer: boolean = true,
      onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void,
    ) => {
      dispatch(closeDialog());
      dispatch(setFlowValue("add account"));
      dispatch(setSourceValue(source));

      const onClose = () => {
        setDrawer();
        trackModularDialogEvent("button_clicked", {
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
        if (autoCloseDrawer) {
          setDrawer();
        }
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
      trackModularDialogEvent,
    ],
  );

  const openAssetFlowDialog = useCallback(
    (drawerConfiguration?: EnhancedModularDrawerConfiguration) => {
      if (isModularDrawerVisible(modularDrawerVisibleParams)) {
        dispatch(setFlowValue(modularDrawerVisibleParams.location));
        dispatch(setSourceValue(source));
        selectCurrencyDialog(
          dispatch,
          openAddAccountFlow,
          undefined,
          handleClose,
          drawerConfiguration,
        );
      } else {
        dispatch(closeDialog());
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
    openAssetFlowDialog,
    openAddAccountFlow,
  };
}
