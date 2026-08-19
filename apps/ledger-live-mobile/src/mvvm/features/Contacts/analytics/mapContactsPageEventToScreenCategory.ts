import type { ContactsPageEventName } from "@features/flow-contacts";

const PAGE_EVENT_PREFIX = "Page ";

export function mapContactsPageEventToScreenCategory(page: ContactsPageEventName): string {
  return page.startsWith(PAGE_EVENT_PREFIX) ? page.slice(PAGE_EVENT_PREFIX.length) : page;
}
