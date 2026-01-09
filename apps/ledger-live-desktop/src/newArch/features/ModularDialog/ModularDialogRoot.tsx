import React, { useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { modularDialogOnCloseSelector, closeDialog } from "~/renderer/reducers/modularDrawer";
import ModularDialogFlowManager from "./ModularDialogFlowManager";

export const ModularDialogRoot: React.FC = () => {
  const onClose = useSelector(modularDialogOnCloseSelector);
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
    dispatch(closeDialog());
  }, [dispatch, onClose]);

  return <ModularDialogFlowManager onClose={handleClose} />;
};
