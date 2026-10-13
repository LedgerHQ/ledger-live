import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { ArrowUp, Check, Copy, PenEdit, Trash } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactAddressDetailDialogLabels } from "./types";

type ContactAddressDetailActionsProps = Readonly<{
  labels: ContactAddressDetailDialogLabels;
  hasCopied: boolean;
  onCopy: () => void;
  onSend?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canSend?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}>;

export function ContactAddressDetailActions({
  labels,
  hasCopied,
  onCopy,
  onSend,
  onEdit,
  onDelete,
  canSend = false,
  canEdit = false,
  canDelete = false,
}: ContactAddressDetailActionsProps): React.ReactNode {
  return (
    <div className="grid w-full grid-cols-4 gap-8">
      <TileButton
        icon={ArrowUp}
        isFull
        disabled={!canSend}
        onClick={onSend}
        data-testid="contacts-address-detail-send"
      >
        {labels.send}
      </TileButton>
      <TileButton
        icon={hasCopied ? Check : Copy}
        onClick={onCopy}
        data-testid="contacts-address-detail-copy"
        isFull
      >
        {hasCopied ? labels.copied : labels.copy}
      </TileButton>
      <TileButton
        icon={PenEdit}
        isFull
        disabled={!canEdit}
        onClick={onEdit}
        data-testid="contacts-address-detail-edit"
      >
        {labels.edit}
      </TileButton>
      <TileButton
        icon={Trash}
        appearance="red"
        data-testid="contacts-address-detail-delete"
        isFull
        disabled={!canDelete}
        onClick={onDelete}
      >
        {labels.delete}
      </TileButton>
    </div>
  );
}
