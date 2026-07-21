import React from "react";
import { SearchInput, SectionHeader, SectionHeaderTitle } from "@ledgerhq/lumen-ui-react";
import {
  isContactsSearchNoResultsViewModel,
  isPopulatedContactsListViewModel,
  type ContactsPageProps,
} from "../../types";
import { ContactsAddContactListItem } from "./ContactsAddContactListItem.web";
import { ContactsMeListItem } from "./ContactsMeListItem.web";
import { ContactsSavedListItem } from "./ContactsSavedListItem.web";
import { ContactsSearchNoResults } from "./ContactsSearchNoResults.web";

type ContactsListProps = Pick<
  ContactsPageProps,
  | "viewModel"
  | "labels"
  | "searchQuery"
  | "meAvatarSrc"
  | "onSearchInputChange"
  | "onOpenMe"
  | "onOpenContact"
  | "onAddContact"
>;

export function ContactsList({
  viewModel,
  labels,
  searchQuery,
  meAvatarSrc,
  onSearchInputChange,
  onOpenMe,
  onOpenContact,
  onAddContact,
}: ContactsListProps): React.ReactNode {
  const savedContactSections = isPopulatedContactsListViewModel(viewModel)
    ? viewModel.sections
    : [];
  const showNoResults = isContactsSearchNoResultsViewModel(viewModel);
  const me = "me" in viewModel ? viewModel.me : undefined;

  let savedContactsContent: React.ReactNode = null;
  if (showNoResults) {
    savedContactsContent = <ContactsSearchNoResults message={labels.searchNoResults} />;
  } else if (savedContactSections.length > 0) {
    savedContactsContent = (
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
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-16" data-testid="contacts-list">
      <div className="flex flex-col gap-8">
        <SearchInput
          value={searchQuery}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchPlaceholder}
          data-testid="contacts-list-search"
          onChange={onSearchInputChange}
        />
        {me ? (
          <ContactsMeListItem
            contact={me}
            avatarSrc={meAvatarSrc}
            formatAddressCount={labels.formatAddressCount}
            onOpen={onOpenMe}
          />
        ) : null}
      </div>
      {savedContactsContent}
      <ContactsAddContactListItem label={labels.addContact} onAddContact={onAddContact} />
    </div>
  );
}
