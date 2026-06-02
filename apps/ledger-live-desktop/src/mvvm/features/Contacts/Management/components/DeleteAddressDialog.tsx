import React from "react";
import { useTranslation } from "react-i18next";
import { DestructiveConfirmDialog } from "./DestructiveConfirmDialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Fired only when the user confirms via the destructive button. The
   * host (`ContactDetails`) decides what "delete this address" means
   * — for L4 today there's no DMK address-removal verb yet, so this
   * is a UX-only confirmation gate; L4.1 will wire the actual
   * removal once the verb ships.
   */
  onConfirm: () => void;
};

/**
 * Destructive confirmation gate for "Delete address" (Figma frame
 * `14152:14729`). Thin wrapper over {@link DestructiveConfirmDialog}
 * — the shell handles the layout, this file owns the copy.
 */
export function DeleteAddressDialog({ open, onOpenChange, onConfirm }: Props) {
  const { t } = useTranslation();

  return (
    <DestructiveConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={t("contactsManagement.deleteAddressDialog.title")}
      body={t("contactsManagement.deleteAddressDialog.body")}
      cancelLabel={t("contactsManagement.deleteAddressDialog.cancel")}
      confirmLabel={t("contactsManagement.deleteAddressDialog.confirm")}
      testIdRoot="contacts-management-delete-address"
    />
  );
}
