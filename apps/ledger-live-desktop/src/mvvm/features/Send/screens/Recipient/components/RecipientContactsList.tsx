import type { Contact } from "@domain/entity-contact";
import { ContactsCompactList } from "@features/flow-contacts-list";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

type RecipientContactsListProps = Readonly<{
  contacts: readonly Contact[];
  onContactSelect: (contact: Contact) => void;
}>;

export function RecipientContactsList({ contacts, onContactSelect }: RecipientContactsListProps) {
  const { t } = useTranslation();
  const labels = useMemo(
    () => ({
      emptyAddress: t("contacts.addressCount", { count: 0 }),
      formatAddressCount: (count: number) => t("contacts.addressCount", { count }),
    }),
    [t],
  );

  return (
    <div data-testid="send-recipient-contacts">
      <Subheader className="mb-4">
        <SubheaderRow>
          <SubheaderTitle>{t("contacts.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ContactsCompactList contacts={contacts} labels={labels} onContactSelect={onContactSelect} />
    </div>
  );
}
