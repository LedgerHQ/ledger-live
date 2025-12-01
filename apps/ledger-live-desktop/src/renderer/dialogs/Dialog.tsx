import React, { useContext, useCallback } from "react";
import { Dialog as LdlsDialog, DialogContent } from "@ledgerhq/ldls-ui-react";
import { context } from "./Provider";

const DialogLayer = () => {
  const { state, setDialog } = useContext(context);
  const { Component, props, open, options } = state;

  const dialogProps = (options.dialogProps || {}) as {
    onOpenChange?: (nextOpen: boolean) => void;
    open?: boolean;
    defaultOpen?: boolean;
    [key: string]: unknown;
  };
  const contentProps = (options.contentProps || {}) as Record<string, unknown>;

  const {
    onOpenChange,
    open: _ignoredOpen,
    defaultOpen: _ignoredDefaultOpen,
    ...restDialogProps
  } = dialogProps;
  const { onClose } = options;

  const handleClose = useCallback(() => {
    onClose?.();
    setDialog();
  }, [onClose, setDialog]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange?.(nextOpen);
      if (!nextOpen) {
        handleClose();
      }
    },
    [handleClose, onOpenChange],
  );

  if (!Component) {
    return null;
  }

  return (
    <LdlsDialog open={open} onOpenChange={handleOpenChange} {...restDialogProps}>
      <DialogContent {...contentProps}>
        <Component onClose={handleClose} {...props} />
      </DialogContent>
    </LdlsDialog>
  );
};

export default DialogLayer;
