import type { Account, AccountLike } from "@ledgerhq/types-live";
import type {
  ModularDrawerConfiguration,
  EnhancedModularDrawerConfiguration,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";
import type { Dispatch } from "redux";
import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";

import { openDialog, closeDialog as closeDialogAction } from "~/renderer/reducers/modularDialog";

export type AssetAndAccountResult = {
  account: AccountLike;
  parentAccount?: Account;
};

type DrawerParams = {
  currencies?: string[];
  drawerConfiguration?: ModularDrawerConfiguration | EnhancedModularDrawerConfiguration;
  useCase?: string;
  uiUseCase?: string;
  areCurrenciesFiltered?: boolean;
  onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
  onCancel?: () => void;
};

function openAssetAndAccountDialog(params: DrawerParams, dispatch: Dispatch) {
  const {
    currencies,
    drawerConfiguration,
    useCase,
    uiUseCase,
    areCurrenciesFiltered,
    onSuccess,
    onCancel,
  } = params;

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
      uiUseCase,
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

export const useOpenAssetAndAccount = () => {
  const dispatch = useDispatch();

  const openAssetAndAccount = useCallback(
    (params: DrawerParams) => openAssetAndAccountDialog({ ...params }, dispatch),
    [dispatch],
  );

  const openAssetAndAccountPromise = useCallback(
    (params: Omit<DrawerParams, "onSuccess" | "onCancel">) =>
      openAssetAndAccountDialogPromise({ ...params }, dispatch),
    [dispatch],
  );

  return { openAssetAndAccount, openAssetAndAccountPromise };
};
