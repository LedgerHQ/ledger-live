import React from "react";
import type { EditNameViewProps } from "./useEditNameViewModel";
import { EditCryptoAddressNameDialog } from "./components/EditCryptoAddressNameDialog";

export const EditNameView = ({
  suggestions,
  initialValue,
  onConfirm,
  open,
  onOpenChange,
  isSyncing,
}: EditNameViewProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSyncing: boolean;
}) => {
  return (
    <EditCryptoAddressNameDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      initialValue={initialValue}
      suggestions={suggestions}
      isSyncing={isSyncing}
    />
  );
};
