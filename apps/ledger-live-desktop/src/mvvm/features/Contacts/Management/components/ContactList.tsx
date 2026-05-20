import React from "react";
import { useTranslation } from "react-i18next";
import { SearchInput } from "@ledgerhq/lumen-ui-react";
import type { Contact } from "~/renderer/contacts/types";
import type { ContactGroup } from "../utils/groupContacts";
import { ContactListItem } from "./ContactListItem";
import { LetterDivider } from "./LetterDivider";

type Props = {
  groups: ContactGroup[];
  searchQuery: string;
  selectedContactName: string;
  onSearchQueryChange: (next: string) => void;
  onSelectContact: (name: string) => void;
};

/**
 * Left pane: search bar + alphabetically-grouped contact list.
 *
 * The pinned "me" group renders without a letter divider; lettered groups
 * render their letter via `LetterDivider`. Groups with zero surviving
 * contacts after the search filter are never produced by `groupContacts`,
 * so no empty-bucket guard is needed here.
 */
export function ContactList({
  groups,
  searchQuery,
  selectedContactName,
  onSearchQueryChange,
  onSelectContact,
}: Props) {
  const { t } = useTranslation();

  const renderContact = (contact: Contact) => (
    <ContactListItem
      key={contact.name}
      contact={contact}
      isSelected={contact.name === selectedContactName}
      onSelect={onSelectContact}
    />
  );

  return (
    <div
      className="flex flex-col gap-8 w-360 shrink-0 border-r border-base h-full"
      data-testid="contacts-management-list"
    >
      <div className="px-24 pt-16">
        <SearchInput
          value={searchQuery}
          placeholder={t("contactsManagement.searchPlaceholder")}
          onChange={e => onSearchQueryChange(e.target.value)}
          onClear={() => onSearchQueryChange("")}
          data-testid="contacts-management-search"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-8">
        {groups.map(group => {
          if (group.kind === "pinned") {
            return (
              <div key="pinned" className="flex flex-col">
                {group.contacts.map(renderContact)}
              </div>
            );
          }
          return (
            <div key={group.letter} className="flex flex-col">
              <LetterDivider letter={group.letter} />
              {group.contacts.map(renderContact)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
