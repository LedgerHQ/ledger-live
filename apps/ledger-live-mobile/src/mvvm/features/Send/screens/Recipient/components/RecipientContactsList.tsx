import type { Contact } from "@domain/entity-contact";
import { ContactsCompactList } from "@features/flow-contacts-list";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { useTranslation } from "~/context/Locale";

type RecipientContactsListProps = Readonly<{
  contacts: readonly Contact[];
  onContactSelect: (contact: Contact) => void;
}>;

export function RecipientContactsList({ contacts, onContactSelect }: RecipientContactsListProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ marginHorizontal: "s8" }} testID="send-recipient-contacts">
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s4" }}>
          <SubheaderTitle>{t("contacts.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ContactsCompactList contacts={contacts} onSelectContact={onContactSelect} />
    </Box>
  );
}
