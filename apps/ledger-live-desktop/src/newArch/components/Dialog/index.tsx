import React, { createContext, useContext, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/ldls-ui-react";

const DialogContext = createContext<{
  openDialog: (content: React.ReactNode) => void;
  closeDialog: () => void;
} | null>(null);

export function DialogProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null);
  const [open, setOpen] = useState(false);

  const openDialog = React.useCallback((content: React.ReactNode) => {
    setDialogContent(content);
    setOpen(true);
  }, []);

  const closeDialog = React.useCallback(() => {
    setOpen(false);
    setTimeout(() => setDialogContent(null), 300); // Clear after animation
  }, []);

  const contextValue = React.useMemo(
    () => ({ openDialog, closeDialog }),
    [openDialog, closeDialog],
  );

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      <Dialog open={open} onOpenChange={open => !open && closeDialog()}>
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
