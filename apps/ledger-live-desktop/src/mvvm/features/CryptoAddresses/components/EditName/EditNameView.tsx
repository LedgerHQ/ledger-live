import React from "react";
import type { EditNameViewProps } from "./useEditNameViewModel";
import { EditCryptoAddressNameDialog } from "./components/EditCryptoAddressNameDialog";

export const EditNameView = ({
  initialValue,
  onConfirm,
  makeDeviceVerb,
  children,
}: EditNameViewProps & { children: React.ReactNode }) => {
  return (
    <EditCryptoAddressNameDialog
      onConfirm={onConfirm}
      initialValue={initialValue}
      makeDeviceVerb={makeDeviceVerb}
    >
      {children}
    </EditCryptoAddressNameDialog>
  );
};
