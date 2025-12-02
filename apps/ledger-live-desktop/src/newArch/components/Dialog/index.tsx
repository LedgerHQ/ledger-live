import React, { createContext, useContext, useState } from "react";
import { Dialog, DialogContent } from "@ledgerhq/ldls-ui-react";

const DialogContext = createContext<{
  openDialog: (content: React.ReactNode) => void;
  closeDialog: () => void;
} | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [DialogContentPassed, setDialogContent] = useState<React.ReactNode | null>(null);

  const [open, setOpen] = useState(false);

  const openDialog = (content: React.ReactNode) => {
    setDialogContent(content);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);

    setTimeout(() => setDialogContent(null), 300); // Clear after animation
  };

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      <Dialog open={open} onOpenChange={open => !open && closeDialog()}>
        <DialogContent className="w-[448px]">{DialogContentPassed}</DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
}

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within DialogProvider");
  return context;
};
