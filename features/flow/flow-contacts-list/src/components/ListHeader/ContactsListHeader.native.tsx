import React from "react";
import { useTranslation } from "@shared/i18n";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsListItem } from "../../types";
import { ContactsAddContactListItem } from "../ContactsList/ListItems/ContactsAddContactListItem.native";
import { ContactsMeListItem } from "../ContactsList/ListItems/ContactsMeListItem.native";

type ContactsListHeaderProps = Readonly<{
  me?: ContactsListItem;
  meAvatarSrc: string;
  showAddContact: boolean;
  onOpenContact: (contactId: ContactsListItem["contactId"]) => void;
  onAddContact: () => void;
}>;

export function ContactsListHeader({
  me,
  meAvatarSrc,
  showAddContact,
  onOpenContact,
  onAddContact,
}: ContactsListHeaderProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Box testID="contacts-list-header" lx={{ gap: "s8" }}>
      {me ? (
        <ContactsMeListItem
          contact={me}
          avatarSrc={meAvatarSrc}
          addressCountLabel={t("contacts.addressCount", { count: me.addressCount })}
          onOpen={onOpenContact}
        />
      ) : null}
      {showAddContact ? (
        <ContactsAddContactListItem label={t("contacts.addContact")} onPress={onAddContact} />
      ) : null}
    </Box>
  );
}
