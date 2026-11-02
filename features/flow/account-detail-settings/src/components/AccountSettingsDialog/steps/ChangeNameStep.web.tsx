import React from "react";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
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
        />
      </DialogBody>
    </>
  );
}
