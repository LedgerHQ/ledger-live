import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type {
  ModularDrawerConfiguration,
  EnhancedModularDrawerConfiguration,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";

import ModularDialogFlowManager from "../ModularDialogFlowManager";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { openAssetAndAccountDrawer, openAssetAndAccountDrawerPromise } from "../../ModularDrawer";
import { useDialog } from "LLD/components/Dialog";

export type AssetAndAccountResult = {
  account: AccountLike;
  parentAccount?: Account;
};

type DrawerParams = {
  currencies?: string[];
  drawerConfiguration?: ModularDrawerConfiguration | EnhancedModularDrawerConfiguration;
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
  onCancel?: () => void;
  openDialog: (content: React.ReactNode, onClose?: () => void) => void;
  closeDialog: () => void;
};

function openAssetAndAccountDialog(params: DrawerParams) {
  const {
    currencies,
    drawerConfiguration,
    useCase,
    areCurrenciesFiltered,
    onSuccess,
    onCancel,
    openDialog,
    closeDialog,
  } = params;

  const modularDrawerConfiguration = createModularDrawerConfiguration(drawerConfiguration);

  const handleSuccess = (result: AssetAndAccountResult): void => {
    closeDialog();
    onSuccess?.(result.account, result.parentAccount);
  };

  openDialog(
    <ModularDialogFlowManager
      currencies={currencies ?? []}
      onAccountSelected={(account, parentAccount) => {
        handleSuccess({ account, parentAccount });
      }}
      drawerConfiguration={modularDrawerConfiguration}
      useCase={useCase}
      areCurrenciesFiltered={areCurrenciesFiltered}
      onClose={onCancel}
    />,
    onCancel,
  );
}

function openAssetAndAccountDialogPromise(
  drawerParams: Omit<DrawerParams, "onSuccess" | "onCancel">,
) {
  return new Promise<AssetAndAccountResult>((resolve, reject) =>
    openAssetAndAccountDialog({
      ...drawerParams,
      onSuccess: (account, parentAccount) => resolve({ account, parentAccount }),
      onCancel: () => reject(new Error("Canceled by user")),
    }),
  );
}

export const useOpenAssetAndAccount = (overrideFf = false) => {
  // Interim hook to switch between dialog and modular drawer implementation
  // To be removed when dialog implementation is fully deprecated LIVE-23773

  const featureModularDrawer = useFeature("lldModularDrawer");

  const { openDialog, closeDialog } = useDialog();

  if (featureModularDrawer?.params?.enableDialogDesktop || overrideFf) {
    return {
      openAssetAndAccount: (params: Omit<DrawerParams, "openDialog" | "closeDialog">) =>
        openAssetAndAccountDialog({ ...params, openDialog, closeDialog }),
      openAssetAndAccountPromise: (
        params: Omit<DrawerParams, "openDialog" | "closeDialog" | "onSuccess" | "onCancel">,
      ) => openAssetAndAccountDialogPromise({ ...params, openDialog, closeDialog }),
    };
  }

  return {
    openAssetAndAccountPromise: openAssetAndAccountDrawerPromise,
    openAssetAndAccount: openAssetAndAccountDrawer,
  };
};
