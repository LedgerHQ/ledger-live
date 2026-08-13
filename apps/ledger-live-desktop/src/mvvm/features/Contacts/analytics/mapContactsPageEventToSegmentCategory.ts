import { CONTACTS_PAGE_EVENTS, type ContactsPageEventName } from "@features/flow-contacts";

const PAGE_EVENT_TO_SEGMENT_CATEGORY = {
  [CONTACTS_PAGE_EVENTS.CONTACTS]: { category: "Contacts" },
  [CONTACTS_PAGE_EVENTS.ACTIVATE_LEDGER_SYNC]: { category: "Activate Ledger Sync" },
  [CONTACTS_PAGE_EVENTS.ADD_CONTACT]: { category: "Add Contact" },
  [CONTACTS_PAGE_EVENTS.CONTACT_DETAIL]: { category: "Contact detail" },
  [CONTACTS_PAGE_EVENTS.ADDRESS_DETAIL]: { category: "Contacts Address detail" },
} as const satisfies Record<ContactsPageEventName, Readonly<{ category: string; name?: string }>>;

export function mapContactsPageEventToSegmentCategory(page: ContactsPageEventName): Readonly<{
  category: string;
  name?: string;
}> {
  return PAGE_EVENT_TO_SEGMENT_CATEGORY[page];
}
