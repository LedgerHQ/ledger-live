import React from "react";
import type { EditNameViewProps } from "./useEditNameViewModel";
import { EditCryptoAddressNameDialog } from "./components/EditCryptoAddressNameDialog";

export const EditNameView = ({
  suggestions,
  initialValue,
  onConfirm,
  children,
}: EditNameViewProps & { children: React.ReactNode }) => {
  return (
    <EditCryptoAddressNameDialog
      onConfirm={onConfirm}
      initialValue={initialValue}
      suggestions={suggestions}
    >
      {children}
    </EditCryptoAddressNameDialog>
  );
};
