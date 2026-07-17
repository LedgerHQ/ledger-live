import React from "react";
import {
  SearchInput,
  SectionHeader,
  SectionHeaderTitle,
} from "@ledgerhq/lumen-ui-react";
import { isPopulatedContactsListViewModel, type ContactsPageProps } from "../../types";
import { ContactsAddContactListItem } from "./ContactsAddContactListItem.web";
import { ContactsMeListItem } from "./ContactsMeListItem.web";
import { ContactsSavedListItem } from "./ContactsSavedListItem.web";

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
  const savedContactSections = isPopulatedContactsListViewModel(viewModel)
    ? viewModel.sections
    : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-16" data-testid="contacts-list">
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
      {savedContactSections.length > 0 ? (
        <div className="flex flex-col gap-16">
          {savedContactSections.map(section => (
            <div
              key={section.title}
              className="flex flex-col gap-8"
              data-testid={`contacts-section-${section.title}`}
            >
              <SectionHeader appearance="plain">
                <SectionHeaderTitle>{section.title}</SectionHeaderTitle>
              </SectionHeader>
              <div className="flex flex-col">
                {section.data.map(contact => (
                  <ContactsSavedListItem
                    key={contact.contactId}
                    contact={contact}
                    formatAddressCount={labels.formatAddressCount}
                    onOpen={onOpenContact}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <ContactsAddContactListItem label={labels.addContact} onAddContact={onAddContact} />
    </div>
  );
}
