import React from "react";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { AccountSettingsEventHandler } from "../../../logic/accountSettingsEvent";
import { ChangeNameContent } from "../../ChangeNameContent/ChangeNameContent";

type Props = Readonly<{
  title: string;
  description: string;
  accountName: string;
  nameMaxLength: number;
  isNameEditDisabled?: boolean;
  onBack: () => void;
  onClose: () => void;
  onConfirmName: (name: string) => void;
  onEvent?: AccountSettingsEventHandler;
}>;

export function ChangeNameStep({
  title,
  description,
  accountName,
  nameMaxLength,
  isNameEditDisabled,
  onBack,
  onClose,
  onConfirmName,
  onEvent,
}: Props) {
  return (
    <>
      <DialogHeader
        density="expanded"
        title={title}
        description={description}
        onBack={onBack}
        onClose={onClose}
      />
      <DialogBody>
        <ChangeNameContent
          initialName={accountName}
          maxLength={nameMaxLength}
          isDisabled={isNameEditDisabled}
          onConfirm={onConfirmName}
          onEvent={onEvent}
        />
      </DialogBody>
    </>
  );
}
