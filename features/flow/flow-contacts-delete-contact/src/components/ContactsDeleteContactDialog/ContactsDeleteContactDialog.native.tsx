import React from "react";
import { Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ContactConfirmationBottomSheet } from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";
import type { ContactsDeleteContactDrawerProps } from "./types";

export function ContactsDeleteContactDialog({
  isOpen,
  isDeleting,
  bottomInset = 0,
  onConfirm,
  onCancel,
}: ContactsDeleteContactDrawerProps): React.JSX.Element {
  const { t } = useTranslation();
  const labels = {
    title: t("contacts.deleteContact.title"),
    description: t("contacts.deleteContact.mobileDescription"),
    confirm: t("contacts.deleteContact.confirm"),
    cancel: t("contacts.deleteContact.cancel"),
  };

  return (
    <ContactConfirmationBottomSheet
      isOpen={isOpen}
      bottomInset={bottomInset}
      icon={Trash}
      labels={labels}
      confirmAppearance="red"
      confirmLoading={isDeleting}
      confirmDisabled={isDeleting}
      confirmTestID="contacts-delete-contact-confirm"
      contentTestID="contacts-delete-contact-content"
      onConfirm={() => void onConfirm()}
      onCancel={onCancel}
    />
  );
}
