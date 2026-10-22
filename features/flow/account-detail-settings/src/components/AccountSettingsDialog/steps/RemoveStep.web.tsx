import React from "react";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { RemoveAccountContent } from "../../RemoveAccountContent";

type Props = Readonly<{
  onBack: () => void;
  onClose: () => void;
  onConfirmRemove: () => void;
}>;

export function RemoveStep({ onBack, onClose, onConfirmRemove }: Props) {
  return (
    <>
      <DialogHeader density="compact" onBack={onBack} onClose={onClose} />
      <DialogBody>
        <RemoveAccountContent onConfirm={onConfirmRemove} onCancel={onClose} />
      </DialogBody>
    </>
  );
}
