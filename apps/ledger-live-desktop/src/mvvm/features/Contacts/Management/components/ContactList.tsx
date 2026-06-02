import React from "react";
import { useTranslation } from "react-i18next";
import { SearchInput } from "@ledgerhq/lumen-ui-react";
import type { Contact } from "~/renderer/contacts/types";
import type { ContactGroup } from "../utils/groupContacts";
import { ContactListItem } from "./ContactListItem";
import { EmptyContactsState } from "./EmptyContactsState";
import { EmptySearchState } from "./EmptySearchState";
import { LetterDivider } from "./LetterDivider";

type Props = {
  groups: ContactGroup[];
  searchQuery: string;
  selectedContactName: string;
  onSearchQueryChange: (next: string) => void;
  onSelectContact: (name: string) => void;
  /**
   * Fired by the empty-state "Add contact" CTA shown below the Me row
   * when the user has no user-added contacts yet. Optional so the
   * list can render in contexts that don't expose the dialog.
   */
  onAddContact?: () => void;
};

/**
 * Left pane of the Contacts management page.
 *
 * Layout (Figma frame 13802:47227):
 * - Outer container: rounded `bg-surface-transparent` panel, padding 16,
 *   `gap-8` vertical between every direct child, full height.
 * - First child: Lumen `SearchInput` with `appearance="plain"`,
 *   placeholder "Search contact". Wired to `searchQuery` /
 *   `setSearchQuery`.
 * - Remaining children: a flat sequence of `LetterDivider` and
 *   `ContactListItem` elements, rendered as direct siblings so the
 *   container's `gap-8` applies uniformly between every divider, every
 *   row, and between the search input and the first row. We deliberately
 *   avoid wrapping groups in intermediate `<div>`s — each wrapper would
 *   absorb the gap and create a 0px stretch between a divider and its
 *   first row.
 *
 * `groupContacts` already guarantees no empty buckets, so no per-group
 * guard is needed here.
 */
export function ContactList({
  groups,
  searchQuery,
  selectedContactName,
  onSearchQueryChange,
  onSelectContact,
  onAddContact,
}: Props) {
  const { t } = useTranslation();

  const renderContact = (contact: Contact) => (
    <ContactListItem
      key={`contact:${contact.name}`}
      contact={contact}
      isSelected={contact.name === selectedContactName}
      onSelect={onSelectContact}
    />
  );

  const children: React.ReactNode[] = [];
  for (const group of groups) {
    if (group.kind === "pinned") {
      for (const contact of group.contacts) children.push(renderContact(contact));
    } else {
      children.push(
        <LetterDivider key={`divider:${group.letter}`} letter={group.letter} />,
      );
      for (const contact of group.contacts) children.push(renderContact(contact));
    }
  }

  // Two distinct empty states — pick at most one:
  //
  //   - `EmptyContactsState`  → no user-added contacts at all (only
  //     the pinned Me row), AND the search query is empty. Renders
  //     a title + body + Add-contact CTA (Figma `14157:15577`).
  //
  //   - `EmptySearchState`    → an active search query returns zero
  //     rows (including Me — `groupContacts` filters the pinned row
  //     when its name doesn't match the query). Renders a single
  //     centred "No contacts found" label (Figma `14158:11604`).
  const trimmedQuery = searchQuery.trim();
  const hasNoOtherContacts = !groups.some(g => g.kind === "letter");
  const showEmptyContacts = hasNoOtherContacts && trimmedQuery.length === 0;
  const showEmptySearch = groups.length === 0 && trimmedQuery.length > 0;

  return (
    <div
      data-testid="contacts-management-list"
      className="flex flex-col gap-8 h-full overflow-y-auto rounded-lg bg-surface p-16"
    >
      <SearchInput
        appearance="plain"
        value={searchQuery}
        placeholder={t("contactsManagement.searchPlaceholder")}
        onChange={e => onSearchQueryChange(e.target.value)}
        onClear={() => onSearchQueryChange("")}
        data-testid="contacts-management-search"
      />
      {children}
      {showEmptyContacts && <EmptyContactsState onAddContact={onAddContact} />}
      {showEmptySearch && <EmptySearchState />}
    </div>
  );
}
