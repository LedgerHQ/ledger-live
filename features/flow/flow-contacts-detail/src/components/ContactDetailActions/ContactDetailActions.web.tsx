import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-react";
import { PenEdit, Trash } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";

export type ContactDetailActionsProps = Readonly<{
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isCollapsed?: boolean;
}>;

export function ContactDetailActions({
  canDelete,
  onEdit,
  onDelete,
  isCollapsed = false,
}: ContactDetailActionsProps): React.ReactNode {
  const { t } = useTranslation();

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
        aria-label={t("contacts.detailActions.editContact")}
        onClick={onEdit}
        data-testid="contacts-detail-edit-action"
      />
      {canDelete ? (
        <IconButton
          appearance="transparent"
          size="sm"
          icon={Trash}
          aria-label={t("contacts.detailActions.deleteContact")}
          onClick={onDelete}
          data-testid="contacts-detail-delete-action"
        />
      ) : null}
    </div>
  );
}
