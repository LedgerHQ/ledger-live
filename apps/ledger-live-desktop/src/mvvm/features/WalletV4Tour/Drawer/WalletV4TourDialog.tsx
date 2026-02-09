import React from "react";
import { Dialog, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";

interface WalletV4TourDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const WalletV4TourDialog = ({ isOpen, onClose }: WalletV4TourDialogProps) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader appearance="extended" title="Wallet V4 Tour" onClose={onClose} />
        {/* Placeholder: future tour content will be rendered here */}
      </DialogContent>
    </Dialog>
  );
};
