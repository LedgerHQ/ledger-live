import React from "react";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { AccountSettingsEventHandler } from "../../../logic/accountSettingsEvent";
import { RemoveAccountContent } from "../../RemoveAccountContent";

type Props = Readonly<{
  onClose: () => void;
  onConfirmRemove: () => void;
  onEvent?: AccountSettingsEventHandler;
}>;

export function RemoveStep({ onClose, onConfirmRemove, onEvent }: Props) {
  return (
    <>
      <DialogHeader density="compact" onClose={onClose} />
      <DialogBody>
        <RemoveAccountContent onConfirm={onConfirmRemove} onCancel={onClose} onEvent={onEvent} />
      </DialogBody>
    </>
  );
}
