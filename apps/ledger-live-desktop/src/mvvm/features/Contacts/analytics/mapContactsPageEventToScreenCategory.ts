import { CONTACTS_PAGE_EVENTS, type ContactsPageEventName } from "@features/flow-contacts";

const CONTACTS_PAGE_EVENT_TO_SCREEN_CATEGORY = {
  [CONTACTS_PAGE_EVENTS.CONTACTS]: { category: "Contacts" },
  [CONTACTS_PAGE_EVENTS.ACTIVATE_LEDGER_SYNC]: { category: "Activate Ledger Sync" },
  [CONTACTS_PAGE_EVENTS.ADD_CONTACT]: { category: "Add Contact" },
  [CONTACTS_PAGE_EVENTS.CONTACT_DETAIL]: { category: "Contact detail" },
  [CONTACTS_PAGE_EVENTS.ADDRESS_DETAIL]: { category: "Contacts Address detail" },
} as const satisfies Record<ContactsPageEventName, Readonly<{ category: string; name?: string }>>;

export function mapContactsPageEventToScreenCategory(page: ContactsPageEventName): Readonly<{
  category: string;
  name?: string;
}> {
  return CONTACTS_PAGE_EVENT_TO_SCREEN_CATEGORY[page];
}
