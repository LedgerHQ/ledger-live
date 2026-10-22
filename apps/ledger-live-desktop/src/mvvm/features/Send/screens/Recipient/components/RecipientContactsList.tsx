import type { Contact } from "@domain/entity-contact";
import { ContactsCompactList } from "@features/flow-contacts-list";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import React from "react";
import { useTranslation } from "react-i18next";

type RecipientContactsListProps = Readonly<{
  contacts: readonly Contact[];
  onContactSelect: (contact: Contact) => void;
}>;

export function RecipientContactsList({ contacts, onContactSelect }: RecipientContactsListProps) {
  const { t } = useTranslation();

  return (
    <div data-testid="send-recipient-contacts">
      <Subheader className="mb-4">
        <SubheaderRow>
          <SubheaderTitle>{t("contacts.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ContactsCompactList contacts={contacts} onContactSelect={onContactSelect} />
    </div>
  );
}
