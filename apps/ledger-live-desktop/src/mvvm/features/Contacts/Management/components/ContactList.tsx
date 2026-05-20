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
 * Left pane of the Contacts management page.
 *
 * Layout (matches Figma frame 13802:2833):
 * - Outer container: rounded `bg-surface-transparent` panel, padding 16,
 *   gap 8 vertical, full height.
 * - Top: Lumen `SearchInput` with `appearance="plain"`, placeholder
 *   "Search contact". Wired to `searchQuery` / `setSearchQuery`.
 * - Below: vertical stack of groups produced by `groupContacts`. The
 *   pinned "me" group renders without a letter divider; lettered groups
 *   render their letter via `LetterDivider`. Empty buckets are never
 *   produced by `groupContacts`, so no per-group guard is needed.
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
      data-testid="contacts-management-list"
      className="flex flex-col gap-8 h-full overflow-y-auto rounded-lg bg-surface-transparent p-16"
    >
      <SearchInput
        appearance="plain"
        value={searchQuery}
        placeholder={t("contactsManagement.searchPlaceholder")}
        onChange={e => onSearchQueryChange(e.target.value)}
        onClear={() => onSearchQueryChange("")}
        data-testid="contacts-management-search"
      />

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
  );
}
