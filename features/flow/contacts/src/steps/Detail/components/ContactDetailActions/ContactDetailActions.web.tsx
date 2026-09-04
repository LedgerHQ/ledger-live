import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { PenEdit, Trash } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactDetailActionsLabels } from "../../types";

export type ContactDetailActionsProps = Readonly<{
  canDelete: boolean;
  labels: ContactDetailActionsLabels;
  onEdit: () => void;
  onDelete: () => void;
  isCollapsed?: boolean;
}>;

export function ContactDetailActions({
  canDelete,
  labels,
  onEdit,
  onDelete,
  isCollapsed = false,
}: ContactDetailActionsProps): React.ReactNode {
  return (
    <div
      className={`absolute flex gap-8 motion-safe:transition-[top,right,transform] motion-safe:duration-[400ms] motion-safe:ease-in-out motion-reduce:transition-none ${
        isCollapsed ? "right-16 top-1/2 -translate-y-1/2" : "right-0 -top-16"
      }`}
      data-testid="contacts-detail-actions"
    >
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
