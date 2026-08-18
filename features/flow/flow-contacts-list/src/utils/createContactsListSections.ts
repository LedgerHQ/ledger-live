import type { ContactsListItem, ContactsListSection } from "../types";

function getSectionTitle(initial: string): string {
  return initial;
}

export function createContactsListSections(
  contacts: readonly ContactsListItem[],
): readonly ContactsListSection[] {
  const sectionsByTitle = new Map<string, ContactsListItem[]>();

  for (const contact of contacts) {
    const title = getSectionTitle(contact.initial);
    const section = sectionsByTitle.get(title) ?? [];

    section.push(contact);
    sectionsByTitle.set(title, section);
  }

  return [...sectionsByTitle.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([title, data]) => ({ title, data }));
}
