import { useCallback } from "react";
import { useTranslation } from "@shared/i18n";
import { DEFAULT_ME_CONTACT_NAME } from "@domain/entity-contact";
import { useContactDisplayName, type ContactDisplayNameInput } from "@features/platform-contacts";

export function usePayContactDisplayName(): (contact: ContactDisplayNameInput) => string {
  const { t } = useTranslation();
  const getContactDisplayName = useContactDisplayName();

  return useCallback(
    contact =>
      contact.isMe && contact.name === DEFAULT_ME_CONTACT_NAME
        ? t("payTab.contacts.me")
        : getContactDisplayName(contact),
    [t, getContactDisplayName],
  );
}
