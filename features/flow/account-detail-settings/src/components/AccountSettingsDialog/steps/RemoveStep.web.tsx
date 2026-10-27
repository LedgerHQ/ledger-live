import React from "react";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { RemoveAccountContent } from "../../RemoveAccountContent";

type Props = Readonly<{
  onClose: () => void;
  onConfirmRemove: () => void;
}>;

export function RemoveStep({ onClose, onConfirmRemove }: Props) {
  return (
    <>
      <DialogHeader density="compact" onClose={onClose} />
      <DialogBody>
        <RemoveAccountContent onConfirm={onConfirmRemove} onCancel={onClose} />
      </DialogBody>
    </>
  );
}
