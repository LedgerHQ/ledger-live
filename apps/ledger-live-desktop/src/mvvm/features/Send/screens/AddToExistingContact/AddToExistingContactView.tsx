import React, { type ChangeEvent } from "react";
import type { ContactId } from "@domain/entity-contact";
import { ContactAvatar } from "@features/platform-contacts";
import {
  isContactsSearchNoResultsViewModel,
  isPopulatedContactsListViewModel,
  type ContactsListItem,
  type ContactsPageViewModel,
} from "@features/flow-contacts-list";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  SearchInput,
  SectionHeader,
  SectionHeaderTitle,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Search } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";

export type AddToExistingContactViewProps = Readonly<{
  viewModel: ContactsPageViewModel;
  searchQuery: string;
  searchPlaceholder: string;
  searchNoResults: string;
  formatAddressCount: (count: number) => string;
  meAvatarSrc: string;
  isOpeningAddressFlow: boolean;
  onSearchInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectContact: (contactId: ContactId) => void;
}>;

function ContactRow({
  contact,
  formatAddressCount,
  onSelectContact,
  isMe,
  meAvatarSrc,
}: Readonly<{
  contact: ContactsListItem;
  formatAddressCount: (count: number) => string;
  onSelectContact: (contactId: ContactId) => void;
  isMe?: boolean;
  meAvatarSrc?: string;
}>) {
  return (
    <ListItem
      onClick={() => onSelectContact(contact.contactId)}
      data-testid={isMe ? "contacts-me-row" : `contacts-saved-row-${contact.contactId}`}
    >
      <ListItemLeading>
        <ContactAvatar
          contactId={contact.contactId}
          name={contact.name}
          size="md"
          ariaHidden
          isMe={isMe}
          src={isMe ? meAvatarSrc : undefined}
          testId={isMe ? "contacts-me-avatar" : `contacts-saved-avatar-${contact.contactId}`}
        />
        <ListItemContent>
          <ListItemTitle>{contact.name}</ListItemTitle>
          <ListItemDescription>{formatAddressCount(contact.addressCount)}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}

export function AddToExistingContactView({
  viewModel,
  searchQuery,
  searchPlaceholder,
  searchNoResults,
  formatAddressCount,
  meAvatarSrc,
  isOpeningAddressFlow,
  onSearchInputChange,
  onSelectContact,
}: AddToExistingContactViewProps) {
  const savedContactSections = isPopulatedContactsListViewModel(viewModel)
    ? viewModel.sections
    : [];
  const showNoResults = isContactsSearchNoResultsViewModel(viewModel);
  const me = "me" in viewModel ? viewModel.me : undefined;

  let savedContactsContent: React.ReactNode = null;
  if (showNoResults) {
    savedContactsContent = (
      <div
        className="flex flex-col items-center justify-center gap-16 py-40"
        data-testid="contacts-search-no-results"
      >
        <Spot appearance="icon" icon={Search} />
        <span className="heading-4-semi-bold text-base">{searchNoResults}</span>
      </div>
    );
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
                <ContactRow
                  key={contact.contactId}
                  contact={contact}
                  formatAddressCount={formatAddressCount}
                  onSelectContact={onSelectContact}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-16 px-24 pb-24",
        isOpeningAddressFlow && "pointer-events-none",
      )}
      data-testid="send-add-to-existing-contact-step"
      aria-busy={isOpeningAddressFlow}
    >
      <div className="flex shrink-0 flex-col gap-8">
        <SearchInput
          value={searchQuery}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          data-testid="contacts-list-search"
          onChange={onSearchInputChange}
        />
        {me ? (
          <ContactRow
            contact={me}
            formatAddressCount={formatAddressCount}
            onSelectContact={onSelectContact}
            isMe
            meAvatarSrc={meAvatarSrc}
          />
        ) : null}
      </div>
      <div
        className="min-h-0 flex-1 overflow-auto scrollbar-custom [scrollbar-gutter:auto]"
        data-testid="contacts-list-scroll"
      >
        {savedContactsContent}
      </div>
    </div>
  );
}
