import type { Account, AccountLike } from "@ledgerhq/types-live";
import type {
  ModularDrawerConfiguration,
  EnhancedModularDrawerConfiguration,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";
import type { Dispatch } from "redux";
import { useDispatch } from "react-redux";

import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { openAssetAndAccountDrawer, openAssetAndAccountDrawerPromise } from "../../ModularDrawer";
import { openDialog, closeDialog as closeDialogAction } from "~/renderer/reducers/modularDrawer";

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
};

function openAssetAndAccountDialog(params: DrawerParams, dispatch: Dispatch) {
  const { currencies, drawerConfiguration, useCase, areCurrenciesFiltered, onSuccess, onCancel } =
    params;

  const modularDrawerConfiguration = createModularDrawerConfiguration(drawerConfiguration);

  const handleSuccess = (result: AssetAndAccountResult): void => {
    dispatch(closeDialogAction());
    onSuccess?.(result.account, result.parentAccount);
  };

  const handleClose = () => {
    dispatch(closeDialogAction());
    onCancel?.();
  };

  dispatch(
    openDialog({
      currencies: currencies ?? [],
      onAccountSelected: (account, parentAccount) => {
        handleSuccess({ account, parentAccount });
      },
      dialogConfiguration: modularDrawerConfiguration,
      useCase,
      areCurrenciesFiltered,
      onClose: handleClose,
    }),
  );
}

function openAssetAndAccountDialogPromise(
  drawerParams: Omit<DrawerParams, "onSuccess" | "onCancel">,
  dispatch: Dispatch,
) {
  return new Promise<AssetAndAccountResult>((resolve, reject) =>
    openAssetAndAccountDialog(
      {
        ...drawerParams,
        onSuccess: (account, parentAccount) => resolve({ account, parentAccount }),
        onCancel: () => reject(new Error("Canceled by user")),
      },
      dispatch,
    ),
  );
}

export const useOpenAssetAndAccount = (overrideFf = false) => {
  // Interim hook to switch between dialog and modular drawer implementation
  // To be removed when dialog implementation is fully deprecated LIVE-23773

  const featureModularDrawer = useFeature("lldModularDrawer");

  const dispatch = useDispatch();

  if (featureModularDrawer?.params?.enableDialogDesktop || overrideFf) {
    return {
      openAssetAndAccount: (params: DrawerParams) =>
        openAssetAndAccountDialog({ ...params }, dispatch),
      openAssetAndAccountPromise: (params: Omit<DrawerParams, "onSuccess" | "onCancel">) =>
        openAssetAndAccountDialogPromise({ ...params }, dispatch),
    };
  }

  return {
    openAssetAndAccountPromise: openAssetAndAccountDrawerPromise,
    openAssetAndAccount: openAssetAndAccountDrawer,
  };
};
