import React from "react";
import { DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { AccountSettingsEventHandler } from "../../../logic/accountSettingsEvent";
import { AccountSettingsMenu } from "../../AccountSettingsMenu";

type Props = Readonly<{
  title: string;
  accountName: string;
  onClose: () => void;
  onShowChangeName: () => void;
  onManageAssets?: () => void;
  onShowAdvancedLogs: () => void;
  explorerUrl?: string;
  onShowRemove: () => void;
  onEvent?: AccountSettingsEventHandler;
}>;

export function MenuStep({
  title,
  accountName,
  onClose,
  onShowChangeName,
  onManageAssets,
  onShowAdvancedLogs,
  explorerUrl,
  onShowRemove,
  onEvent,
}: Props) {
  return (
    <>
      <DialogHeader density="expanded" title={title} onClose={onClose} />
      <DialogBody>
        <AccountSettingsMenu
          accountName={accountName}
          onChangeName={onShowChangeName}
          onManageAssets={onManageAssets}
          onViewAdvancedLogs={onShowAdvancedLogs}
          explorerUrl={explorerUrl}
          onRemoveAccount={onShowRemove}
          onEvent={onEvent}
        />
      </DialogBody>
    </>
  );
}
