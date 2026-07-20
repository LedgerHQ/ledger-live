import type { ContactsListItem } from "../types";

export type ContactsListSection = Readonly<{
  initial: string;
  contacts: readonly ContactsListItem[];
}>;

export function groupSavedContactsByInitial(
  savedContacts: readonly ContactsListItem[],
): readonly ContactsListSection[] {
  const sections: { initial: string; contacts: ContactsListItem[] }[] = [];

  for (const contact of savedContacts) {
    const lastSection = sections.at(-1);

    if (lastSection?.initial === contact.initial) {
      lastSection.contacts.push(contact);
      continue;
    }

    sections.push({ initial: contact.initial, contacts: [contact] });
  }

  return sections;
}
