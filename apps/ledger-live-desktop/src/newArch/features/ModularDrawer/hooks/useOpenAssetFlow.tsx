import { useCallback } from "react";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setDrawer } from "~/renderer/drawers/Provider";
import ModularDrawerAddAccountFlowManager from "../ModularDrawerAddAccountFlowManager";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import { useModularDrawerAnalytics } from "../analytics/useModularDrawerAnalytics";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { CloseButton } from "../components/CloseButton";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ModularDrawerLocation, useModularDrawerVisibility } from "LLD/features/ModularDrawer";
import { Account } from "@ledgerhq/types-live";

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
      flow: modularDrawerLocation,
      page: currentRouteNameRef.current ?? "Unknown",
    });
  }, [modularDrawerLocation, trackModularDrawerEvent]);

  const openAddAccountFlow = useCallback(
    (
      currency: CryptoOrTokenCurrency,
      autoCloseDrawer: boolean = true,
      onAccountSelected?: (account: Account) => void,
    ) => {
      const onClose = () => {
        setDrawer();
        trackModularDrawerEvent("button_clicked", {
          button: "Close",
          flow: "add account",
          page: currentRouteNameRef.current ?? "Unknown",
        });
      };
      if (featureNetworkBasedAddAccount?.enabled) {
        setDrawer(
          ModularDrawerAddAccountFlowManager,
          {
            currency,
            source,
            onAccountSelected,
          },
          { closeButtonComponent: CloseButton, onRequestClose: onClose },
        );
      } else {
        const cryptoCurrency =
          currency.type === "CryptoCurrency" ? currency : currency.parentCurrency;
        autoCloseDrawer && setDrawer();
        dispatch(openModal("MODAL_ADD_ACCOUNTS", { currency: cryptoCurrency }));
      }
    },
    [dispatch, featureNetworkBasedAddAccount?.enabled, source, trackModularDrawerEvent],
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
    openAddAccountFlow,
  };
}
