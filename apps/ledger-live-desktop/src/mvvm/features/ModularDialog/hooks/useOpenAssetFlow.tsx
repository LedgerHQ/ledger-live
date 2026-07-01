import { useCallback } from "react";

import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { ModularDrawerVisibleParams } from "@ledgerhq/live-common/modularDrawer/types/visibility";
import { useDispatch } from "LLD/hooks/redux";
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
} from "~/renderer/reducers/modularDialog";

function selectCurrencyDialog(
  dispatch: ReturnType<typeof useDispatch>,
  onAssetSelected: (currency: CryptoOrTokenCurrency) => void,
  currencyIds?: string[],
  onClose?: () => void,
  dialogConfiguration?: EnhancedModularDrawerConfiguration,
): void {
  const filteredCurrencies = currencyIds ?? [];

  dispatch(
    openDialog({
      currencies: filteredCurrencies,
      areCurrenciesFiltered: filteredCurrencies.length > 0,
      onAssetSelected,
      dialogConfiguration: dialogConfiguration ?? {
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
  const dispatch = useDispatch();
  const { trackModularDialogEvent } = useModularDialogAnalytics();

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

      const onFlowFinishedWithModalReopen = (account: AccountLike, parentAccount?: Account) => {
        setDrawer();
        if (modalNameToReopen) {
          dispatch(openModal(modalNameToReopen, { account, parentAccount }));
        }
      };

      setDrawer(
        ModularDrawerAddAccountFlowManager,
        {
          currency,
          onAccountSelected: modalNameToReopen ? onFlowFinishedWithModalReopen : onAccountSelected,
        },
        { closeButtonComponent: CloseButton, onRequestClose: onClose },
      );
    },
    [dispatch, modalNameToReopen, source, trackModularDialogEvent],
  );

  const openAssetFlow = useCallback(
    (dialogConfiguration?: EnhancedModularDrawerConfiguration, currencyIds?: string[]) => {
      dispatch(setFlowValue(modularDrawerVisibleParams.location));
      dispatch(setSourceValue(source));
      selectCurrencyDialog(
        dispatch,
        openAddAccountFlow,
        currencyIds,
        handleClose,
        dialogConfiguration,
      );
    },
    [dispatch, handleClose, modularDrawerVisibleParams, openAddAccountFlow, source],
  );

  return {
    openAssetFlow,
    openAddAccountFlow,
  };
}
