import type { Contact } from "@domain/entity-contact";
import { ContactsCompactList } from "@features/flow-contacts-list";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import React, { useMemo } from "react";
import { useTranslation } from "~/context/Locale";

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
    <Box lx={{ marginHorizontal: "s8" }} testID="send-recipient-contacts">
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s4" }}>
          <SubheaderTitle>{t("contacts.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ContactsCompactList contacts={contacts} labels={labels} onContactSelect={onContactSelect} />
    </Box>
  );
}
