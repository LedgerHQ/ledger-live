import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type {
  ModularDrawerConfiguration,
  EnhancedModularDrawerConfiguration,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";

import ModularDialogFlowManager from "../ModularDialogFlowManager";
import { closeDialog, openDialog } from "LLD/components/Dialog";

type Result = {
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

function openAssetAndAccountDialog(params: DrawerParams): void {
  const { currencies, drawerConfiguration, useCase, areCurrenciesFiltered, onSuccess, onCancel } =
    params;

  const modularDrawerConfiguration = createModularDrawerConfiguration(drawerConfiguration);

  const handleSuccess = (result: Result): void => {
    closeDialog();
    onSuccess?.(result.account, result.parentAccount);
  };

  return openDialog(
    <ModularDialogFlowManager
      currencies={currencies ?? []}
      onAccountSelected={(account, parentAccount) => {
        handleSuccess({ account, parentAccount });
      }}
      drawerConfiguration={modularDrawerConfiguration}
      useCase={useCase}
      areCurrenciesFiltered={areCurrenciesFiltered}
    ></ModularDialogFlowManager>,
    onCancel,
  );
}

// TODO implement the following
// const CloseButtonWithTracking = ({ onRequestClose }: React.ComponentProps<typeof CloseButton>) => {
//   const flow = useSelector(modularDrawerFlowSelector);

//   const handleClose: React.ComponentProps<typeof CloseButton>["onRequestClose"] = mouseEvent => {
//     track("button_clicked", {
//       button: "Close",
//       flow,
//       page: currentRouteNameRef.current,
//     });
//     onRequestClose(mouseEvent);
//   };

//   return <CloseButton onRequestClose={handleClose} />;
// };

function openAssetAndAccountDialogPromise(
  drawerParams: Omit<DrawerParams, "onSuccess" | "onCancel">,
) {
  return new Promise<Result>((resolve, reject) =>
    openAssetAndAccountDialog({
      ...drawerParams,
      onSuccess: (account, parentAccount) => resolve({ account, parentAccount }),
      onCancel: () => reject(new Error("Canceled by user")),
    }),
  );
}

export { openAssetAndAccountDialogPromise, openAssetAndAccountDialog };
