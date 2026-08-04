import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { PenEdit, Trash } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactDetailActionsLabels } from "../../types";

export type ContactDetailActionsProps = Readonly<{
  canDelete: boolean;
  labels: ContactDetailActionsLabels;
  onEdit: () => void;
  onDelete: () => void;
}>;

export function ContactDetailActions({
  canDelete,
  labels,
  onEdit,
  onDelete,
}: ContactDetailActionsProps): React.ReactNode {
  return (
    <div className="absolute right-16 top-16 flex gap-8" data-testid="contacts-detail-actions">
      <IconButton
        appearance="transparent"
        size="sm"
        icon={PenEdit}
        aria-label={labels.editContact}
        onClick={onEdit}
        data-testid="contacts-detail-edit-action"
      />
      {canDelete ? (
        <IconButton
          appearance="transparent"
          size="sm"
          icon={Trash}
          aria-label={labels.deleteContact}
          onClick={onDelete}
          data-testid="contacts-detail-delete-action"
        />
      ) : null}
    </div>
  );
}
