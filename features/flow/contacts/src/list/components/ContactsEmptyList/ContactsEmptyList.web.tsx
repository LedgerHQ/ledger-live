import React from "react";
import { SearchInput } from "@ledgerhq/lumen-ui-react";
import type { ContactsEmptyListProps } from "../../types";
import { ContactsPageLayout } from "../ContactsPageLayout/ContactsPageLayout.web";
import { ContactsAddContactListItem } from "./ContactsAddContactListItem.web";
import { ContactsMeListItem } from "./ContactsMeListItem.web";

export function ContactsEmptyList({
  viewModel,
  labels,
  meAvatarSrc,
  onOpenMe,
  onAddContact,
}: ContactsEmptyListProps): React.ReactNode {
  const { me } = viewModel;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-24 pb-32" data-testid="contacts-page">
      <ContactsPageLayout
        title={labels.title}
        addContactLabel={labels.addContact}
        onAddContact={onAddContact}
        list={
          <div className="flex flex-col" data-testid="contacts-empty-list">
            <div className="flex flex-col gap-8">
              <SearchInput
                value=""
                readOnly
                placeholder={labels.searchPlaceholder}
                aria-label={labels.searchPlaceholder}
                data-testid="contacts-empty-list-search"
              />
              <ContactsMeListItem
                contact={me}
                avatarSrc={meAvatarSrc}
                formatAddressCount={labels.formatAddressCount}
                onOpen={onOpenMe}
              />
            </div>
            <ContactsAddContactListItem label={labels.addContact} onAddContact={onAddContact} />
          </div>
        }
      />
    </div>
  );
}
