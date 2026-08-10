import React, { useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import {
  modularDialogOnCloseSelector,
  closeDialog,
  modularDialogIsOpenSelector,
  modularDialogPresentationSelector,
} from "~/renderer/reducers/modularDialog";
import ModularDialogFlowManager from "./ModularDialogFlowManager";

const ModularDialogRoot: React.FC = () => {
  const onClose = useSelector(modularDialogOnCloseSelector);
  const isOpen = useSelector(modularDialogIsOpenSelector);
  const presentation = useSelector(modularDialogPresentationSelector);
  const dispatch = useDispatch();

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
    dispatch(closeDialog());
  }, [dispatch, onClose]);

  if (!isOpen || presentation === "embedded") return null;

  return <ModularDialogFlowManager onClose={handleClose} />;
};

export default ModularDialogRoot;
