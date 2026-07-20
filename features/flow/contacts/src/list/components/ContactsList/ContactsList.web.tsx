import React from "react";
import { SearchInput } from "@ledgerhq/lumen-ui-react";
import type { ContactsPageProps } from "../../types";
import { ContactsAddContactListItem } from "./ContactsAddContactListItem.web";
import { ContactsMeListItem } from "./ContactsMeListItem.web";

type ContactsListProps = Pick<
  ContactsPageProps,
  "viewModel" | "labels" | "meAvatarSrc" | "onOpenContact" | "onAddContact"
>;

export function ContactsList({
  viewModel,
  labels,
  meAvatarSrc,
  onOpenContact,
  onAddContact,
}: ContactsListProps): React.ReactNode {
  return (
    <div className="flex flex-col" data-testid="contacts-list">
      <div className="flex flex-col gap-8">
        <SearchInput
          value=""
          readOnly
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchPlaceholder}
          data-testid="contacts-list-search"
        />
        <ContactsMeListItem
          contact={viewModel.me}
          avatarSrc={meAvatarSrc}
          formatAddressCount={labels.formatAddressCount}
          onOpen={onOpenContact}
        />
      </div>
      <ContactsAddContactListItem label={labels.addContact} onAddContact={onAddContact} />
    </div>
  );
}
