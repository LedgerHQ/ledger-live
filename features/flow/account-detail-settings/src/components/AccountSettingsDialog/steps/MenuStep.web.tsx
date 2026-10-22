import React from "react";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { AccountSettingsMenu } from "../../AccountSettingsMenu";

type Props = Readonly<{
  title: string;
  accountName: string;
  onClose: () => void;
  onShowChangeName: () => void;
  onShowAdvancedLogs: () => void;
  onShowRemove: () => void;
}>;

export function MenuStep({
  title,
  accountName,
  onClose,
  onShowChangeName,
  onShowAdvancedLogs,
  onShowRemove,
}: Props) {
  return (
    <>
      <DialogHeader density="expanded" title={title} onClose={onClose} />
      <DialogBody>
        <AccountSettingsMenu
          accountName={accountName}
          onChangeName={onShowChangeName}
          onViewAdvancedLogs={onShowAdvancedLogs}
          onRemoveAccount={onShowRemove}
        />
      </DialogBody>
    </>
  );
}
