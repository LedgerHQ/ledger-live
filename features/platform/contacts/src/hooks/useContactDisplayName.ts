import { DEFAULT_ME_CONTACT_NAME } from "@domain/entity-contact";
import { useTranslation } from "@shared/i18n";
import { useCallback } from "react";

export type ContactDisplayNameInput = Readonly<{ name: string; isMe: boolean }>;

/** The one way to show a contact's name: Me is always "<name> (Me)", or "My addresses (Me)". */
export function useContactDisplayName(): (contact: ContactDisplayNameInput) => string {
  const { t } = useTranslation();

  return useCallback(
    ({ name, isMe }) => {
      if (!isMe) {
        return name;
      }

      const meName = name === DEFAULT_ME_CONTACT_NAME ? t("contacts.me.myAddresses") : name;
      return t("contacts.detail.meDisplayName", { name: meName });
    },
    [t],
  );
}
