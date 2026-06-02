import React from "react";
import { useTranslation } from "react-i18next";
import { DestructiveConfirmDialog } from "./DestructiveConfirmDialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Fired only when the user confirms via the destructive button. The
   * host (`ContactDetails`) is responsible for the actual deletion +
   * any post-delete selection change.
   */
  onConfirm: () => void;
};

/**
 * Destructive confirmation gate for "Delete contact" (Figma frame
 * `14151:13408`). Thin wrapper over {@link DestructiveConfirmDialog} —
 * the shell handles the layout, this file owns the copy.
 */
export function DeleteContactDialog({ open, onOpenChange, onConfirm }: Props) {
  const { t } = useTranslation();

  return (
    <DestructiveConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={t("contactsManagement.deleteContactDialog.title")}
      body={t("contactsManagement.deleteContactDialog.body")}
      cancelLabel={t("contactsManagement.deleteContactDialog.cancel")}
      confirmLabel={t("contactsManagement.deleteContactDialog.confirm")}
      testIdRoot="contacts-management-delete-contact"
    />
  );
}
