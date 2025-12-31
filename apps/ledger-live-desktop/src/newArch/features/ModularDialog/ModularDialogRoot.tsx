import React, { useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { modularDialogParamsSelector, closeDialog } from "~/renderer/reducers/modularDrawer";
import ModularDialogFlowManager from "./ModularDialogFlowManager";

export const ModularDialogRoot: React.FC = () => {
  const dialogParams = useSelector(modularDialogParamsSelector);
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    if (dialogParams?.onClose) {
      dialogParams.onClose();
    }
    dispatch(closeDialog());
  }, [dispatch, dialogParams]);

  if (!dialogParams) return null;

  return (
    <ModularDialogFlowManager
      currencies={dialogParams.currencies ?? []}
      dialogConfiguration={dialogParams.dialogConfiguration}
      useCase={dialogParams.useCase}
      areCurrenciesFiltered={dialogParams.areCurrenciesFiltered}
      onAssetSelected={dialogParams.onAssetSelected}
      onAccountSelected={dialogParams.onAccountSelected}
      onClose={handleClose}
    />
  );
};
