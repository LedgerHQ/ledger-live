import { selectContactById, type ContactId } from "@domain/entity-contact";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { createMeDisplayNameFormatter } from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";
import { createContactDetailSharedState } from "./model/contactDetailSharedState";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export function useContactDetailSharedState(contactId: ContactId | undefined) {
  const { t } = useTranslation();
  const contact = useSelector((state: ContactsStateRoot) =>
    contactId ? selectContactById(state, contactId) : undefined,
  );
  const formatMeDisplayName = useMemo(
    () =>
      createMeDisplayNameFormatter(t("contacts.me.myAddresses"), name =>
        t("contacts.detail.meDisplayName", { name }),
      ),
    [t],
  );

  return useMemo(
    () => (contact ? createContactDetailSharedState(contact, formatMeDisplayName) : undefined),
    [contact, formatMeDisplayName],
  );
}
