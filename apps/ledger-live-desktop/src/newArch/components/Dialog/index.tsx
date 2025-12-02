import React, { createContext, useContext, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/ldls-ui-react";

export let openDialog: (content: React.ReactNode, onClose?: () => void) => void = () => null;
export let closeDialog: () => void = () => null;

const DialogContext = createContext<{
  openDialog: (content: React.ReactNode, onClose?: () => void) => void;
  closeDialog: () => void;
} | null>(null);

export function DialogProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null);
  const [open, setOpen] = useState(false);
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | undefined>(undefined);

  const _openDialog = React.useCallback((content: React.ReactNode, onClose?: () => void) => {
    setDialogContent(content);
    setOnCloseCallback(() => onClose);
    setOpen(true);
  }, []);

  const _closeDialog = React.useCallback(() => {
    setOpen(false);
    setOnCloseCallback(undefined);
    setTimeout(() => setDialogContent(null), 300); // Clear after animation
  }, []);

  const contextValue = React.useMemo(
    () => ({ openDialog: _openDialog, closeDialog: _closeDialog }),
    [_openDialog, _closeDialog],
  );

  useEffect(() => {
    openDialog = _openDialog;
    closeDialog = _closeDialog;
    return () => {
      openDialog = () => null;
      closeDialog = () => null;
    };
  }, [_openDialog, _closeDialog]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (onCloseCallback) onCloseCallback();
      _closeDialog();
    }
  };
  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>{dialogContent}</DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
}

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within DialogProvider");
  return context;
};
