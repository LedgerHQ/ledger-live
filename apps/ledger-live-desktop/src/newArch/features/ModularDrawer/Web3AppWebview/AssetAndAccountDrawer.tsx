import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import type {
  ModularDrawerConfiguration,
  EnhancedModularDrawerConfiguration,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";
import { type CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setDrawer } from "~/renderer/drawers/Provider";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import { type WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import { useSelector } from "react-redux";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { modularDrawerStateSelector } from "~/renderer/reducers/modularDrawer";
import { CloseButton } from "../components/CloseButton";

type Result = {
  account: AccountLike;
  parentAccount?: Account;
};

type DrawerParams = {
  assetIds?: string[];
  currencies?: CryptoOrTokenCurrency[];
  accounts$?: Observable<WalletAPIAccount[]>;
  includeTokens?: boolean;
  drawerConfiguration?: ModularDrawerConfiguration | EnhancedModularDrawerConfiguration;
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
  onCancel?: () => void;
};

function openAssetAndAccountDrawer(params: DrawerParams): void {
  const {
    assetIds,
    currencies,
    accounts$,
    includeTokens,
    drawerConfiguration,
    useCase,
    areCurrenciesFiltered,
    onSuccess,
    onCancel,
  } = params;

  const modularDrawerConfiguration = createModularDrawerConfiguration(drawerConfiguration);

  const handleSuccess = (result: Result): void => {
    setDrawer();
    onSuccess?.(result.account, result.parentAccount);
  };

  const handleCancel = (): void => {
    setDrawer();
    onCancel?.();
  };

  const filteredCurrencies =
    currencies ?? listAndFilterCurrencies({ currencies: assetIds, includeTokens });

  return setDrawer(
    ModularDrawerFlowManager,
    {
      currencies: filteredCurrencies,
      accounts$,
      onAccountSelected: (account, parentAccount) => {
        handleSuccess({ account, parentAccount });
      },
      drawerConfiguration: modularDrawerConfiguration,
      useCase,
      areCurrenciesFiltered,
    },
    {
      closeButtonComponent: CloseButtonWithTracking,
      onRequestClose: handleCancel,
    },
  );
}

const CloseButtonWithTracking = ({ onRequestClose }: React.ComponentProps<typeof CloseButton>) => {
  const { flow } = useSelector(modularDrawerStateSelector);

  const handleClose: React.ComponentProps<typeof CloseButton>["onRequestClose"] = mouseEvent => {
    track("button_clicked", {
      button: "Close",
      flow,
      page: currentRouteNameRef.current,
    });
    onRequestClose(mouseEvent);
  };

  return <CloseButton onRequestClose={handleClose} />;
};

function openAssetAndAccountDrawerPromise(
  drawerParams: Omit<DrawerParams, "onSuccess" | "onCancel">,
) {
  return new Promise<Result>((resolve, reject) =>
    openAssetAndAccountDrawer({
      ...drawerParams,
      onSuccess: (account, parentAccount) => resolve({ account, parentAccount }),
      onCancel: () => reject(new Error("Canceled by user")),
    }),
  );
}

export { openAssetAndAccountDrawerPromise, openAssetAndAccountDrawer };
