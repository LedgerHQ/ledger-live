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
    // Panel = a NON-scrolling flex column: a fixed search-bar header on
    // top, then a scrolling list region below it, so the search bar stays
    // pinned and always visible on long lists.
    //
    // `min-h-0` + `overflow-hidden` are load-bearing: this div is a grid
    // item (see ManagementView). Grid/flex items default to
    // `min-height: auto`, so without them it would grow to fit the whole
    // list and spill out of the cell instead of letting the inner region
    // scroll. (The old single `overflow-y-auto` container got this
    // implicitly.)
    <div
      data-testid="contacts-management-list"
      // `pt-16 px-16` but NO bottom padding: the scrolling list region
      // reaches the panel's bottom edge so content is cut flush with the
      // container (clipped by `overflow-hidden` + `rounded-lg`) instead of
      // leaving a 16px gap below the last row.
      className="flex flex-col gap-8 h-full min-h-0 overflow-hidden rounded-lg bg-surface pt-16 px-16"
    >
      <SearchInput
        appearance="plain"
        value={searchQuery}
        placeholder={t("contactsManagement.searchPlaceholder")}
        onChange={e => onSearchQueryChange(e.target.value)}
        onClear={() => onSearchQueryChange("")}
        // `shrink-0` so the fixed-header search bar keeps its height and
        // is never compressed by the list region below it.
        className="shrink-0"
        data-testid="contacts-management-search"
      />
      {/*
        Scrolling list region. `flex-1 min-h-0` fills the height left by
        the header AND shrinks below its content so it actually scrolls
        (the classic flexbox `min-height: 0` overflow fix). `gap-8` keeps
        the 8px rhythm between dividers and rows that the single-container
        layout had.

        Scrollbar (grey + discreet, in the right gutter):
        - `scrollbar-custom` is Lumen's thin, rounded, grey scrollbar
          (`--background-muted-strong`).
        - macOS overlay scrollbars (the "show scrollbars when scrolling"
          default) DON'T reserve layout width — they float over content.
          So we pin the row inset directly with `pr-16` (matching the
          left), and `-mr-16` extends the region to the panel's right edge
          so the floating scrollbar sits over the empty 16px gutter to the
          right of the rows rather than on top of them.
      */}
      <div className="flex flex-col gap-8 flex-1 min-h-0 overflow-y-auto scrollbar-custom -mr-16 pr-16">
        {children}
        {showEmptyContacts && <EmptyContactsState onAddContact={onAddContact} />}
        {showEmptySearch && <EmptySearchState />}
      </div>
    </div>
  );
}
