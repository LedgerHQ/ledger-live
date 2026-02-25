import React, { useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import {
  modularDialogOnCloseSelector,
  closeDialog,
  modularDialogIsOpenSelector,
} from "~/renderer/reducers/modularDrawer";
import ModularDialogFlowManager from "./ModularDialogFlowManager";

export const ModularDialogRoot: React.FC = () => {
  const onClose = useSelector(modularDialogOnCloseSelector);
  const isOpen = useSelector(modularDialogIsOpenSelector);
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
    dispatch(closeDialog());
  }, [dispatch, onClose]);

  if (!isOpen) return null;

  return <ModularDialogFlowManager onClose={handleClose} />;
};
